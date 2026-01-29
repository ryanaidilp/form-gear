/**
 * NestedService
 *
 * Manages nested component operations (insert, delete, change).
 * Replaces insertSidebarArray, deleteSidebarArray, changeSidebarArray,
 * insertSidebarNumber, deleteSidebarNumber, createComponent from GlobalFunction.tsx.
 */

import { batch } from 'solid-js';
import type { FormStores } from '../stores/createStores';
import type {
  ReferenceDetail,
  SidebarDetail,
  FormGearConfig,
  Option,
} from '../core/types';
import { ComponentType, PATTERNS } from '../core/constants';
import type { ReferenceService } from './ReferenceService';
import type { ExpressionService } from './ExpressionService';
import logger from '../utils/logger';

/**
 * Component with nested position information
 */
interface NestedComponentInfo {
  dataKey: string;
  nestedPosition: number;
  componentPosition: number;
  sidebarPosition: number;
  parentIndex: number[];
  parentName: string | null;
  parentLevel?: number; // Level of the parent nested component
}

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  position: number;
  data: string | ReferenceDetail;
}

/**
 * Service for managing nested form components.
 * Each FormGear instance gets its own NestedService.
 */
export class NestedService {
  private stores: FormStores;
  private referenceService: ReferenceService;
  private expressionService: ExpressionService;
  private config: FormGearConfig;

  constructor(
    stores: FormStores,
    referenceService: ReferenceService,
    expressionService: ExpressionService,
    config: FormGearConfig
  ) {
    this.stores = stores;
    this.referenceService = referenceService;
    this.expressionService = expressionService;
    this.config = config;
  }

  // ===========================================================================
  // Public Nested Operations
  // ===========================================================================

  /**
   * Insert a nested component from an array-based selection (e.g., checkbox, multi-select).
   *
   * @param dataKey - The parent component's dataKey
   * @param answer - The selected option { label, value }
   * @param sidebarPosition - Current sidebar position for history
   */
  insertFromArray(
    dataKey: string,
    answer: Option,
    sidebarPosition: number
  ): void {
    logger.log('NestedService', 'insertFromArray called:', { dataKey, answer, sidebarPosition });

    let component = this.referenceService.getComponent(dataKey);
    logger.log('NestedService', 'Parent component from reference:', component);

    // Get components from nested store if not in reference (nested store has the template)
    let components = component?.components;
    logger.log('NestedService', 'Component components:', components);

    // Check nested store for correct level and components
    // The nested store has the authoritative level set during initial form processing
    const [nestedStore] = this.stores.nested;
    const nestedDetails = nestedStore.details as Array<{
      dataKey: string;
      components?: unknown;
      level?: number;
      index?: number[];
      label?: string;
      name?: string;
      description?: string;
      sourceQuestion?: string;
      enable?: boolean;
      enableCondition?: string;
      componentEnable?: string[];
    }>;

    logger.log('NestedService', 'Looking for dataKey in nested store:', dataKey);
    const nestedEntry = nestedDetails.find((n) => n.dataKey === dataKey);
    logger.log('NestedService', 'Nested store entry:', nestedEntry);

    if (nestedEntry) {
      // Always use components from nested store if available (has correct template)
      if (!components) {
        components = nestedEntry.components;
      }
      // Update component with level from nested store
      // The nested store has the correct level from initial form processing
      // IMPORTANT: Do NOT override index - the reference component has the correct
      // instance index (e.g., [0,1,1,0,2]) while nested store has template index
      if (component) {
        component = {
          ...component,
          level: nestedEntry.level ?? component.level,
          // Keep the reference component's index - it's the actual instance index
          // label and name from nested store are fallbacks if reference doesn't have them
          label: component.label || nestedEntry.label,
          name: component.name || nestedEntry.name,
        } as ReferenceDetail;
        logger.log('NestedService', 'Updated component with nested store values:', {
          level: component.level,
          index: component.index,
        });
      }
    }

    // Fallback to sidebar if still not found
    if (!components) {
      const [sidebar] = this.stores.sidebar;
      const sidebarEntry = sidebar.details.find(
        (s: SidebarDetail) => s.dataKey === dataKey
      );
      logger.log('NestedService', 'Sidebar entry (fallback):', sidebarEntry);
      components = sidebarEntry?.components;
    }

    if (!component || !components) {
      logger.log('NestedService', 'No component or no components array, returning');
      return;
    }

    // For nested-in-nested components, find the correct runtime index from the sidebar
    // The reference component's index may be the template index, not the actual runtime index
    // We need to find the sidebar entry that contains this nested component to get correct index
    const [sidebar] = this.stores.sidebar;
    let runtimeIndex = component.index;

    const parentSidebar = sidebar.details.find((s) => {
      if (!s.components?.[0]) return false;
      const comps = s.components[0] as ReferenceDetail[];
      return comps.some((c) => c.dataKey === dataKey);
    });

    if (parentSidebar) {
      // Found the sidebar containing this component - compute correct index
      const comps = parentSidebar.components[0] as ReferenceDetail[];
      const compPosition = comps.findIndex((c) => c.dataKey === dataKey);
      runtimeIndex = [...parentSidebar.index, 0, compPosition];
      logger.log('NestedService', 'Found parent sidebar, computed runtime index:', {
        parentSidebarDataKey: parentSidebar.dataKey,
        parentSidebarIndex: JSON.stringify(parentSidebar.index),
        compPosition,
        runtimeIndex: JSON.stringify(runtimeIndex),
      });
    }

    // Create a merged component with the components array and correct runtime index
    const componentWithComponents = {
      ...component,
      components,
      index: runtimeIndex,
    } as ReferenceDetail;
    logger.log('NestedService', 'Component with components:', componentWithComponents);

    // Create components for the new nested section
    const newComponents = this.createNestedComponents(
      componentWithComponents,
      Number(answer.value),
      sidebarPosition,
      answer.label
    );

    logger.log('NestedService', 'Created new components:', newComponents.length);
    if (newComponents.length === 0) return;

    try {
      // Insert into reference store
      logger.log('NestedService', 'About to insertIntoReference');
      this.insertIntoReference(newComponents, componentWithComponents);
      logger.log('NestedService', 'insertIntoReference completed');

      // Create and insert sidebar entry
      logger.log('NestedService', 'About to insertIntoSidebar');
      this.insertIntoSidebar(componentWithComponents, answer, newComponents, sidebarPosition);
      logger.log('NestedService', 'insertIntoSidebar completed');

      // Initialize answers for new components
      logger.log('NestedService', 'About to initializeNestedAnswers');
      this.initializeNestedAnswers(newComponents, sidebarPosition);
      logger.log('NestedService', 'initializeNestedAnswers completed');

      logger.log('NestedService', 'insertFromArray completed successfully');
    } catch (error) {
      console.error('[NestedService] Error in insertFromArray:', error);
    }
  }

  /**
   * Delete a nested component from an array-based selection.
   *
   * @param dataKey - The parent component's dataKey
   * @param beforeAnswer - The option being removed { label, value }
   * @param sidebarPosition - Current sidebar position for history
   */
  deleteFromArray(
    dataKey: string,
    beforeAnswer: Option,
    sidebarPosition: number
  ): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    const targetIndex = [...component.index, Number(beforeAnswer.value)];

    // Remove from reference
    this.removeFromReference(targetIndex);

    // Remove from sidebar
    this.removeFromSidebar(targetIndex, sidebarPosition);
  }

  /**
   * Handle changes to array-based nested selections.
   * Determines if items were added, removed, or just relabeled.
   *
   * @param dataKey - The parent component's dataKey
   * @param answer - Current selection
   * @param beforeAnswer - Previous selection
   * @param sidebarPosition - Current sidebar position
   */
  changeFromArray(
    dataKey: string,
    answer: Option[],
    beforeAnswer: Option[],
    sidebarPosition: number
  ): void {
    // Find newly added items
    const toAdd: Option[] = [];
    for (const item of answer) {
      const existedBefore = beforeAnswer.some(
        (b) => Number(b.value) === Number(item.value)
      );
      if (!existedBefore) {
        toAdd.push(item);
      }
    }

    // Find removed items
    const toRemove: Option[] = [];
    for (const item of beforeAnswer) {
      const stillExists = answer.some(
        (a) => Number(a.value) === Number(item.value)
      );
      if (!stillExists) {
        toRemove.push(item);
      }
    }

    // Check for label changes (same value, different label)
    if (toAdd.length === 0 && toRemove.length === 0) {
      this.handleLabelChange(dataKey, answer, beforeAnswer);
      return;
    }

    // Process additions
    for (const item of toAdd) {
      this.insertFromArray(dataKey, item, sidebarPosition);
    }

    // Process removals
    for (const item of toRemove) {
      this.deleteFromArray(dataKey, item, sidebarPosition);
    }
  }

  /**
   * Insert nested components for a number-based source (e.g., number input).
   *
   * @param dataKey - The parent component's dataKey
   * @param targetCount - Target number of nested sections
   * @param currentCount - Current number of nested sections
   * @param sidebarPosition - Current sidebar position
   */
  insertFromNumber(
    dataKey: string,
    targetCount: number,
    currentCount: number,
    sidebarPosition: number
  ): void {
    logger.log('NestedService', 'insertFromNumber called:', { dataKey, targetCount, currentCount, sidebarPosition });

    let component = this.referenceService.getComponent(dataKey);
    logger.log('NestedService', 'Parent component from reference:', component);

    // Get components from nested store if not in reference (nested store has the template)
    let components = component?.components;
    logger.log('NestedService', 'Component components:', components);

    // Check nested store for correct level and components
    // The nested store has the authoritative level set during initial form processing
    const [nestedStore] = this.stores.nested;
    const nestedDetails = nestedStore.details as Array<{
      dataKey: string;
      components?: unknown;
      level?: number;
      index?: number[];
      label?: string;
      name?: string;
      description?: string;
      sourceQuestion?: string;
      enable?: boolean;
      enableCondition?: string;
      componentEnable?: string[];
    }>;

    logger.log('NestedService', 'Looking for dataKey in nested store:', dataKey);
    const nestedEntry = nestedDetails.find((n) => n.dataKey === dataKey);
    logger.log('NestedService', 'Nested store entry:', nestedEntry);

    if (nestedEntry) {
      // Always use components from nested store if available (has correct template)
      if (!components) {
        components = nestedEntry.components;
      }
      // Update component with level from nested store
      // The nested store has the correct level from initial form processing
      // IMPORTANT: Do NOT override index - the reference component has the correct
      // instance index (e.g., [0,1,1,0,2]) while nested store has template index
      if (component) {
        component = {
          ...component,
          level: nestedEntry.level ?? component.level,
          // Keep the reference component's index - it's the actual instance index
          // label and name from nested store are fallbacks if reference doesn't have them
          label: component.label || nestedEntry.label,
          name: component.name || nestedEntry.name,
        } as ReferenceDetail;
        logger.log('NestedService', 'Updated component with nested store values:', {
          level: component.level,
          index: component.index,
        });
      }
    }

    // Fallback to sidebar if still not found
    if (!components) {
      const [sidebar] = this.stores.sidebar;
      const sidebarEntry = sidebar.details.find(
        (s: SidebarDetail) => s.dataKey === dataKey
      );
      logger.log('NestedService', 'Sidebar entry (fallback):', sidebarEntry);
      components = sidebarEntry?.components;
    }

    if (!component || !components) {
      logger.log('NestedService', 'No component or no components array, returning');
      return;
    }

    // For nested-in-nested components, find the correct runtime index from the sidebar
    // The reference component's index may be the template index, not the actual runtime index
    // We need to find the sidebar entry that contains this nested component to get correct index
    const [sidebar] = this.stores.sidebar;
    let runtimeIndex = component.index;

    const parentSidebar = sidebar.details.find((s) => {
      if (!s.components?.[0]) return false;
      const comps = s.components[0] as ReferenceDetail[];
      return comps.some((c) => c.dataKey === dataKey);
    });

    if (parentSidebar) {
      // Found the sidebar containing this component - compute correct index
      const comps = parentSidebar.components[0] as ReferenceDetail[];
      const compPosition = comps.findIndex((c) => c.dataKey === dataKey);
      runtimeIndex = [...parentSidebar.index, 0, compPosition];
      logger.log('NestedService', 'Found parent sidebar, computed runtime index:', {
        parentSidebarDataKey: parentSidebar.dataKey,
        parentSidebarIndex: JSON.stringify(parentSidebar.index),
        compPosition,
        runtimeIndex: JSON.stringify(runtimeIndex),
      });
    }

    // Create a merged component with the components array and correct runtime index
    const componentWithComponents = {
      ...component,
      components,
      index: runtimeIndex,
    } as ReferenceDetail;
    logger.log('NestedService', 'Component with components:', componentWithComponents);

    for (let i = currentCount + 1; i <= targetCount; i++) {
      const newComponents = this.createNestedComponents(
        componentWithComponents,
        i,
        sidebarPosition,
        String(i)
      );

      logger.log('NestedService', 'Created new components:', newComponents.length);
      if (newComponents.length === 0) continue;

      try {
        // Insert into reference store
        logger.log('NestedService', 'About to insertIntoReference');
        this.insertIntoReference(newComponents, componentWithComponents);
        logger.log('NestedService', 'insertIntoReference completed');

        // Create and insert sidebar entry
        // For number-based sources, format description with dashes like original FormGear
        logger.log('NestedService', 'About to insertIntoSidebar');
        this.insertIntoSidebar(
          componentWithComponents,
          { label: `<i>___________ # ${i}</i>`, value: i },
          newComponents,
          sidebarPosition
        );
        logger.log('NestedService', 'insertIntoSidebar completed');

        // Initialize answers for new components
        logger.log('NestedService', 'About to initializeNestedAnswers');
        this.initializeNestedAnswers(newComponents, sidebarPosition);
        logger.log('NestedService', 'initializeNestedAnswers completed');

        logger.log('NestedService', 'insertFromNumber iteration completed successfully for i:', i);
      } catch (error) {
        console.error('[NestedService] Error in insertFromNumber iteration:', error);
      }
    }
  }

  /**
   * Delete nested components for a number-based source.
   *
   * @param dataKey - The parent component's dataKey
   * @param targetCount - Target number of nested sections
   * @param currentCount - Current number of nested sections
   * @param sidebarPosition - Current sidebar position
   */
  deleteFromNumber(
    dataKey: string,
    targetCount: number,
    currentCount: number,
    sidebarPosition: number
  ): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    for (let i = currentCount; i > targetCount; i--) {
      const targetIndex = [...component.index, i];
      this.removeFromReference(targetIndex);
      this.removeFromSidebar(targetIndex, sidebarPosition);
    }
  }

  /**
   * Handle nested component updates based on answer type.
   *
   * @param dataKey - The component's dataKey
   * @param answer - New answer value
   * @param beforeAnswer - Previous answer value
   * @param sidebarPosition - Current sidebar position
   */
  handleNestedUpdate(
    dataKey: string,
    answer: unknown,
    beforeAnswer: unknown,
    sidebarPosition: number
  ): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component || component.type !== ComponentType.NESTED) return;
    if (!component.sourceQuestion) return;

    // Determine if source is array-based or number-based
    const sourceComponent = this.referenceService.getComponent(
      component.sourceQuestion
    );
    if (!sourceComponent) return;

    if (Array.isArray(answer)) {
      // Array-based (checkbox, multi-select)
      const currentAnswer = (answer as Option[]) || [];
      const previousAnswer = (beforeAnswer as Option[]) || [];

      if (currentAnswer.length > previousAnswer.length) {
        // Items added
        const newItems = currentAnswer.filter(
          (item) =>
            !previousAnswer.some((prev) => prev.value === item.value)
        );
        for (const item of newItems) {
          this.insertFromArray(dataKey, item, sidebarPosition);
        }
      } else if (currentAnswer.length < previousAnswer.length) {
        // Items removed
        const removedItems = previousAnswer.filter(
          (item) =>
            !currentAnswer.some((curr) => curr.value === item.value)
        );
        for (const item of removedItems) {
          this.deleteFromArray(dataKey, item, sidebarPosition);
        }
      } else {
        // Same length - check for changes
        this.changeFromArray(
          dataKey,
          currentAnswer,
          previousAnswer,
          sidebarPosition
        );
      }
    } else if (typeof answer === 'number') {
      // Number-based
      const currentCount = answer as number;
      const previousCount = (beforeAnswer as number) || 0;

      if (currentCount > previousCount) {
        this.insertFromNumber(
          dataKey,
          currentCount,
          previousCount,
          sidebarPosition
        );
      } else if (currentCount < previousCount) {
        this.deleteFromNumber(
          dataKey,
          currentCount,
          previousCount,
          sidebarPosition
        );
      }
    }
  }

  // ===========================================================================
  // Private Component Creation
  // ===========================================================================

  /**
   * Create a component for a nested section.
   */
  private createNestedComponent(
    template: ReferenceDetail,
    info: NestedComponentInfo
  ): ReferenceDetail {
    const newComp = JSON.parse(JSON.stringify(template)) as ReferenceDetail;

    // Update dataKey and name with nested position
    newComp.dataKey = `${template.dataKey}${PATTERNS.NESTED_SEPARATOR}${info.nestedPosition}`;
    // Use name if available, otherwise fall back to dataKey
    const baseName = template.name || template.dataKey;
    newComp.name = `${baseName}${PATTERNS.NESTED_SEPARATOR}${info.nestedPosition}`;

    // Set default answer based on type
    if (template.type === ComponentType.PHOTO) {
      newComp.answer = [{ label: 'lastId#0', value: 0 }];
    } else if (!newComp.answer) {
      newComp.answer = '';
    }

    // Update index - ensure index exists first
    if (!newComp.index || !Array.isArray(newComp.index)) {
      // Create default index based on nested position and component position
      newComp.index = [0, info.nestedPosition, 0, info.componentPosition] as any;
    } else if (info.parentIndex.length === 0) {
      // Clone the index array to avoid modifying the original
      newComp.index = [...newComp.index] as any;
      if (newComp.index.length >= 2) {
        newComp.index[newComp.index.length - 2] = info.nestedPosition;
      }
    } else {
      newComp.index = [...info.parentIndex, 0, info.componentPosition] as any;
    }

    // Replace $NAME$ placeholder in label
    if (info.parentName) {
      newComp.label = newComp.label.replace('$NAME$', info.parentName);
    }

    // Update sourceQuestion
    if (newComp.sourceQuestion) {
      newComp.sourceQuestion = `${newComp.sourceQuestion}${PATTERNS.NESTED_SEPARATOR}${info.nestedPosition}`;
    }

    // Update sourceOption with row markers
    newComp.sourceOption = this.updateRowMarkerReference(
      newComp.sourceOption,
      info.nestedPosition
    );

    // Update componentVar references
    const originalCompVar = newComp.componentVar || [];
    newComp.componentVar = this.updateRowMarkerReferences(
      originalCompVar,
      info.nestedPosition
    );
    logger.log('NestedService', 'Updated componentVar:', {
      dataKey: newComp.dataKey,
      type: newComp.type,
      originalCompVar,
      newCompVar: newComp.componentVar,
    });

    // Update expression with new references
    if (newComp.expression && originalCompVar.length > 0) {
      let newExpression = newComp.expression;
      for (let i = 0; i < originalCompVar.length; i++) {
        newExpression = newExpression.replace(
          originalCompVar[i],
          newComp.componentVar[i]
        );
      }
      newComp.expression = newExpression;
    }

    // Update componentEnable references
    const originalCompEnable = newComp.componentEnable || [];
    newComp.componentEnable = this.updateRowMarkerReferences(
      originalCompEnable,
      info.nestedPosition
    );

    // Update enableCondition with new references
    if (newComp.enableCondition && originalCompEnable.length > 0) {
      let newCondition = newComp.enableCondition;
      for (let i = 0; i < originalCompEnable.length; i++) {
        newCondition = newCondition.replace(
          originalCompEnable[i],
          newComp.componentEnable[i]
        );
      }
      newComp.enableCondition = newCondition;
    }

    // Evaluate enable condition
    newComp.enable = this.evaluateComponentEnable(newComp);

    // Reset remark state
    newComp.hasRemark = false;

    // Set level for nested (type 2) components based on parent level
    // This ensures proper sidebar hierarchy for nested-in-nested scenarios
    if (template.type === ComponentType.NESTED && info.parentLevel !== undefined) {
      // Nested components inside a parent get level = parentLevel + 1
      // This matches how createFormGear.tsx processes nested components
      newComp.level = info.parentLevel + 1;
      logger.log('NestedService', 'Set nested component level:', {
        dataKey: newComp.dataKey,
        parentLevel: info.parentLevel,
        newLevel: newComp.level,
      });
    }

    // Recursively process nested children (sections, nested)
    if (
      (template.type === ComponentType.SECTION ||
        template.type === ComponentType.NESTED) &&
      (template as any).components?.[0]
    ) {
      const childComponents: ReferenceDetail[] = [];
      const templateComponents = (template as any).components[0] as ReferenceDetail[];

      // Child level is current component's level (for nested children of nested)
      const childLevel = newComp.level ?? (info.parentLevel ?? 0) + 1;

      for (let i = 0; i < templateComponents.length; i++) {
        const childInfo: NestedComponentInfo = {
          dataKey: templateComponents[i].dataKey,
          nestedPosition: info.nestedPosition,
          componentPosition: i,
          sidebarPosition: info.sidebarPosition,
          parentIndex: [...newComp.index],
          parentName: null,
          parentLevel: childLevel, // Pass current level so grandchildren get correct level
        };
        childComponents.push(
          this.createNestedComponent(templateComponents[i], childInfo)
        );
      }

      (newComp as any).components = [childComponents];
    }

    return newComp;
  }

  /**
   * Create all nested components for a parent.
   */
  private createNestedComponents(
    parent: ReferenceDetail,
    nestedPosition: number,
    sidebarPosition: number,
    parentName: string
  ): ReferenceDetail[] {
    const components: ReferenceDetail[] = [];
    logger.log('NestedService', 'createNestedComponents parent:', {
      dataKey: parent.dataKey,
      level: parent.level,
      index: parent.index,
    });
    const templateComponents = (parent as any).components?.[0] as
      | ReferenceDetail[]
      | undefined;
    logger.log('NestedService', 'templateComponents:', templateComponents?.length);

    if (!templateComponents) {
      logger.log('NestedService', 'No templateComponents, returning empty array');
      return components;
    }

    // Parent level determines child level - children are one level deeper
    const parentLevel = parent.level ?? 1;

    // For first-level nested (level 1), pass empty parentIndex to use template index modification
    // For second-level and deeper nested (level 2+), pass parent's actual index
    // This matches production behavior where:
    // - parentIndex.length == 0: modifies template index (first-level)
    // - parentIndex.length > 0: uses [...parentIndex, 0, componentPosition] (nested-in-nested)
    const shouldUseParentIndex = parentLevel >= 2;
    const parentIndexForChildren = shouldUseParentIndex ? [...parent.index, nestedPosition] : [];

    logger.log('NestedService', 'Index strategy:', {
      parentLevel,
      shouldUseParentIndex,
      parentIndexForChildren: JSON.stringify(parentIndexForChildren),
    });

    for (let i = 0; i < templateComponents.length; i++) {
      try {
        logger.log('NestedService', `Creating component ${i}:`, templateComponents[i].dataKey);
        const info: NestedComponentInfo = {
          dataKey: templateComponents[i].dataKey,
          nestedPosition,
          componentPosition: i,
          sidebarPosition,
          parentIndex: parentIndexForChildren,
          parentName,
          parentLevel, // Pass parent level so children get correct level
        };
        const newComp = this.createNestedComponent(templateComponents[i], info);
        logger.log('NestedService', `Created component ${i}:`, newComp.dataKey, 'level:', newComp.level);
        components.push(newComp);
      } catch (error) {
        console.error(`[NestedService] Error creating component ${i}:`, error);
      }
    }

    logger.log('NestedService', 'createNestedComponents returning', components.length, 'components');
    return components;
  }

  // ===========================================================================
  // Private Store Operations
  // ===========================================================================

  /**
   * Insert components into the reference store.
   */
  private insertIntoReference(
    components: ReferenceDetail[],
    parent: ReferenceDetail
  ): void {
    if (components.length === 0) return;

    const [reference, setReference] = this.stores.reference;
    const [indexMap] = this.stores.referenceMap;

    // Find insertion position
    const insertPosition = this.findInsertPosition(
      components[0].index,
      reference.details
    );

    // Build updated reference
    const updatedRef = [...reference.details];
    let position = insertPosition;
    const currentIndexMap = indexMap();
    const insertedComponents: ReferenceDetail[] = [];

    for (const component of components) {
      // Check if dataKey exists in the index map (plain object, not Map)
      if (!(component.dataKey in currentIndexMap)) {
        updatedRef.splice(position, 0, component);
        insertedComponents.push(component);
        position++;
      }
    }

    // Update store in batch
    batch(() => {
      setReference('details', updatedRef);
      this.referenceService.rebuildIndexMap();
      // Register new components in dependency maps (for nested-in-nested support)
      if (insertedComponents.length > 0) {
        this.referenceService.registerDynamicComponents(insertedComponents);
      }
    });
  }

  /**
   * Remove components from the reference store.
   */
  private removeFromReference(targetIndex: number[]): void {
    const [reference, setReference] = this.stores.reference;

    const updatedRef = reference.details.filter((component) => {
      const componentIndex = [...component.index];
      componentIndex.length = targetIndex.length;
      return JSON.stringify(componentIndex) !== JSON.stringify(targetIndex);
    });

    batch(() => {
      setReference('details', updatedRef);
      this.referenceService.rebuildIndexMap();
    });
  }

  /**
   * Insert a sidebar entry.
   */
  private insertIntoSidebar(
    parent: ReferenceDetail,
    answer: Option,
    components: ReferenceDetail[],
    sidebarPosition: number
  ): void {
    const [sidebar, setSidebar] = this.stores.sidebar;

    // The level comes directly from the nested template's level property,
    // which was set correctly during initial form processing in createFormGear.tsx
    // (level 1 for nested inside section, level 2 for nested inside nested, etc.)
    // The parent's index is now the correct runtime index (set in insertFromArray/insertFromNumber)
    logger.log('NestedService', 'insertIntoSidebar:', {
      parentDataKey: parent.dataKey,
      parentLevel: parent.level,
      parentIndex: JSON.stringify(parent.index),
      answer: answer.value,
    });

    // Use parent's index directly - it's now the correct runtime index
    // (set in insertFromArray/insertFromNumber by finding the parent sidebar)
    const newSide: SidebarDetail = {
      dataKey: `${parent.dataKey}${PATTERNS.NESTED_SEPARATOR}${answer.value}`,
      name: parent.name,
      label: parent.label,
      description: answer.label,
      level: parent.level ?? 1,
      index: [...parent.index, Number(answer.value)],
      components: [components] as any,
      sourceQuestion: parent.sourceQuestion,
      enable: parent.enable ?? true,
      enableCondition: parent.enableCondition,
      componentEnable: parent.componentEnable,
    };

    logger.log('NestedService', 'Creating sidebar entry:', {
      dataKey: newSide.dataKey,
      level: newSide.level,
      index: JSON.stringify(newSide.index),
      parentIndex: JSON.stringify(parent.index),
      label: newSide.label,
    });

    // Check if already exists
    const exists = sidebar.details.some((s) => s.dataKey === newSide.dataKey);
    if (exists) {
      logger.log('NestedService', 'Sidebar entry already exists, skipping:', newSide.dataKey);
      return;
    }

    // Find insertion position
    const insertPos = this.findSidebarInsertPosition(
      newSide.index,
      sidebar.details,
      sidebarPosition
    );

    logger.log('NestedService', 'Inserting sidebar at position:', {
      insertPos,
      currentSidebarLength: sidebar.details.length,
    });

    const updatedSidebar = [...sidebar.details];
    updatedSidebar.splice(insertPos, 0, newSide);

    logger.log('NestedService', 'Sidebar after insert:', {
      newLength: updatedSidebar.length,
      entries: updatedSidebar.map((s) => ({
        dataKey: s.dataKey,
        level: s.level,
        index: JSON.stringify(s.index),
      })),
    });

    setSidebar('details', updatedSidebar);

    // Register any nested components inside the created components to the nested store
    // This enables second-level (and deeper) nested component creation
    // Components already have correct level set by createNestedComponent
    this.registerNestedComponentsInStore(components);
  }

  /**
   * Register nested components (type 2) in the nested store.
   * This ensures their templates are available for deeper nested levels.
   *
   * @param components - The components to scan for nested types
   */
  private registerNestedComponentsInStore(
    components: ReferenceDetail[]
  ): void {
    const [nestedStore, setNestedStore] = this.stores.nested;
    const currentDetails = [...(nestedStore.details as Array<{
      dataKey: string;
      components?: unknown;
      level?: number;
      index?: number[];
      label?: string;
      name?: string;
      description?: string;
      sourceQuestion?: string;
      enable?: boolean;
      enableCondition?: string;
      componentEnable?: string[];
    }>)];

    for (const component of components) {
      if (component.type === ComponentType.NESTED && (component as any).components) {
        const exists = currentDetails.some((n) => n.dataKey === component.dataKey);
        if (!exists) {
          // The component already has the correct level set by createNestedComponent
          logger.log('NestedService', 'Registering nested component in store:', component.dataKey, 'level:', component.level);
          // Include all properties needed for sidebar insertion
          currentDetails.push({
            dataKey: component.dataKey,
            components: (component as any).components,
            level: component.level, // Use component's level (set in createNestedComponent)
            index: component.index as number[],
            label: component.label,
            name: component.name,
            description: component.description,
            sourceQuestion: component.sourceQuestion,
            enable: component.enable,
            enableCondition: component.enableCondition,
            componentEnable: component.componentEnable,
          });
        }
      }
    }

    // Update nested store if we added new entries
    if (currentDetails.length > (nestedStore.details as unknown[]).length) {
      setNestedStore('details', currentDetails);
    }
  }

  /**
   * Remove a sidebar entry.
   */
  private removeFromSidebar(
    targetIndex: number[],
    sidebarPosition: number
  ): void {
    const [sidebar, setSidebar] = this.stores.sidebar;

    const updatedSidebar = sidebar.details.filter((section) => {
      const sectionIndex = [...section.index];
      sectionIndex.length = targetIndex.length;
      return JSON.stringify(sectionIndex) !== JSON.stringify(targetIndex);
    });

    setSidebar('details', updatedSidebar);
  }

  /**
   * Initialize answers for newly created nested components.
   */
  private initializeNestedAnswers(
    components: ReferenceDetail[],
    sidebarPosition: number
  ): void {
    const [response] = this.stores.response;
    const [preset] = this.stores.preset;

    for (const component of components) {
      let value: unknown = component.answer || '';
      let isInitial = false;

      if (component.type === ComponentType.VARIABLE) {
        // Evaluate variable expression
        value = this.expressionService.evaluateVariable(
          component.expression || '',
          component.dataKey
        );
        isInitial = true;
      } else {
        // Check for existing response
        const responseAnswer = response.details.answers.find(
          (a) => a.dataKey === component.dataKey
        );
        if (responseAnswer) {
          value = responseAnswer.answer;
        } else {
          // Check for preset
          const presetAnswer = preset.details.predata.find(
            (p) => p.dataKey === component.dataKey
          );
          if (presetAnswer && this.shouldUsePreset(component)) {
            value = presetAnswer.answer;
          } else {
            isInitial = true;
          }
        }
      }

      // Update component answer
      this.referenceService.updateComponent(component.dataKey, 'answer', value);
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Update a reference string with row marker to include nested position.
   * Transforms dataKey@$ROW$ -> dataKey#nestedPosition
   */
  private updateRowMarkerReference(
    reference: string | undefined,
    nestedPosition: number
  ): string | undefined {
    if (!reference) return reference;

    const parts = reference.split('@');
    if (parts.length < 2) return reference;

    const rowMarker = parts[1];
    if (['$ROW$', '$ROW1$', '$ROW2$'].includes(rowMarker)) {
      // Replace @$ROW$ with #nestedPosition (resolve the row marker)
      return `${parts[0]}${PATTERNS.NESTED_SEPARATOR}${nestedPosition}`;
    }

    return reference;
  }

  /**
   * Update an array of references with row markers.
   * Transforms dataKey@$ROW$ -> dataKey#nestedPosition
   */
  private updateRowMarkerReferences(
    references: string[],
    nestedPosition: number
  ): string[] {
    return references.map((ref) => {
      const parts = ref.split('@');
      if (parts.length < 2) return ref;

      const rowMarker = parts[1];
      if (['$ROW$', '$ROW1$', '$ROW2$'].includes(rowMarker)) {
        // Replace @$ROW$ with #nestedPosition (resolve the row marker)
        return `${parts[0]}${PATTERNS.NESTED_SEPARATOR}${nestedPosition}`;
      }

      return ref;
    });
  }

  /**
   * Evaluate if a component should be enabled.
   */
  private evaluateComponentEnable(component: ReferenceDetail): boolean {
    if (!component.enableCondition || component.enableCondition.trim() === '') {
      return true;
    }

    return this.expressionService.evaluateEnableCondition(
      component.enableCondition,
      component.dataKey
    );
  }

  /**
   * Check if preset should be used for a component.
   */
  private shouldUsePreset(component: ReferenceDetail): boolean {
    const config = this.config;
    return (
      config.initialMode === 2 ||
      (config.initialMode === 1 && !!component.presetMaster)
    );
  }

  /**
   * Find the correct position to insert new reference components.
   */
  private findInsertPosition(
    newIndex: number[],
    details: ReferenceDetail[]
  ): number {
    const indexLength = newIndex.length;

    for (let depth = indexLength; depth > 1; depth--) {
      const searchIndex = newIndex.slice(0, depth);

      for (let i = details.length - 1; i >= 0; i--) {
        const componentIndex = details[i].index.slice(0, depth);
        if (JSON.stringify(componentIndex) === JSON.stringify(searchIndex)) {
          return i + 1;
        }
      }
    }

    return details.length;
  }

  /**
   * Find the correct position to insert a new sidebar entry.
   */
  private findSidebarInsertPosition(
    newIndex: number[],
    sidebarDetails: SidebarDetail[],
    startPosition: number
  ): number {
    const indexLength = newIndex.length;

    for (let depth = indexLength; depth > 1; depth--) {
      const searchIndex = newIndex.slice(0, depth);

      for (let i = sidebarDetails.length - 1; i >= startPosition; i--) {
        if (!sidebarDetails[i]) continue;

        const sidebarIndex = sidebarDetails[i].index.slice(0, depth);
        if (JSON.stringify(sidebarIndex) === JSON.stringify(searchIndex)) {
          const newVal = newIndex[depth] ?? 0;
          const existingVal = sidebarDetails[i].index[depth] ?? 0;

          if (depth === indexLength - 1 || newVal >= existingVal) {
            return i + 1;
          }
        }
      }
    }

    return sidebarDetails.length;
  }

  /**
   * Handle label changes in nested components (same values, different labels).
   */
  private handleLabelChange(
    dataKey: string,
    answer: Option[],
    beforeAnswer: Option[]
  ): void {
    const [sidebar, setSidebar] = this.stores.sidebar;
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    // Find items with changed labels
    for (const current of answer) {
      const previous = beforeAnswer.find(
        (b) => b.value === current.value && b.label !== current.label
      );

      if (!previous) continue;

      // Find the sidebar entry
      const targetIndex = [...component.index, Number(current.value)];
      const sidebarIndex = sidebar.details.findIndex(
        (s) => JSON.stringify(s.index) === JSON.stringify(targetIndex)
      );

      if (sidebarIndex === -1) continue;

      // Update sidebar description and component labels
      const oldDesc = sidebar.details[sidebarIndex].description;
      const newDesc = current.label;

      const updatedSection = { ...sidebar.details[sidebarIndex] };
      updatedSection.description = newDesc;

      if (updatedSection.components?.[0]) {
        const updatedComponents = (
          updatedSection.components[0] as ReferenceDetail[]
        ).map((comp) => ({
          ...comp,
          label: comp.label.replace(oldDesc || '', newDesc),
        }));
        updatedSection.components = [updatedComponents] as any;
      }

      setSidebar('details', sidebarIndex, updatedSection);
    }
  }
}
