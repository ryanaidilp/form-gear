/**
 * EnableService
 *
 * Manages enable/disable logic for form components.
 * Replaces runEnabling and setEnableFalse from GlobalFunction.tsx.
 */

import type { FormStores } from '../stores/createStores';
import type {
  ReferenceDetail,
  SidebarDetail,
  FormGearConfig,
} from '../core/types';
import { ComponentType, PATTERNS } from '../core/constants';
import type { ReferenceService } from './ReferenceService';
import type { ExpressionService } from './ExpressionService';

/**
 * Service for managing enable/disable states.
 * Each FormGear instance gets its own EnableService.
 */
export class EnableService {
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
  // Public Enable Methods
  // ===========================================================================

  /**
   * Evaluate and update the enable state for a component.
   *
   * @param dataKey - The component's dataKey
   * @returns The new enable state
   */
  evaluateEnable(dataKey: string): boolean {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return true;

    // If no enable condition, component is enabled
    if (!component.enableCondition || component.enableCondition.trim() === '') {
      return true;
    }

    const enable = this.expressionService.evaluateEnableCondition(
      component.enableCondition,
      dataKey
    );

    // Update the component's enable state
    this.referenceService.updateComponent(dataKey, 'enable', enable);

    return enable;
  }

  /**
   * Re-evaluate enable conditions for all dependents of a dataKey.
   * Called when an answer changes that might affect enable conditions.
   *
   * @param sourceDataKey - The dataKey whose answer changed
   */
  evaluateDependents(sourceDataKey: string): void {
    // Evaluate sidebar dependents
    this.evaluateSidebarDependents(sourceDataKey);

    // Evaluate component dependents
    this.evaluateComponentDependents(sourceDataKey);
  }

  /**
   * Initialize enable states for all components.
   * Should be called during form initialization.
   */
  initializeEnableStates(): void {
    const [reference] = this.stores.reference;

    for (const component of reference.details) {
      if (component.enableCondition) {
        this.evaluateEnable(component.dataKey);
      }
    }

    // Update disabled sections cache
    this.updateDisabledSectionsCache();
  }

  /**
   * Set enable to false for a component and all its children.
   *
   * @param dataKey - The component's dataKey
   */
  disableComponent(dataKey: string): void {
    this.referenceService.updateComponent(dataKey, 'enable', false);

    // If this is a section/nested, disable all children
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    if (
      component.type === ComponentType.SECTION ||
      component.type === ComponentType.NESTED
    ) {
      this.disableChildren(dataKey);
    }
  }

  /**
   * Set enable to true for a component, re-evaluating children's conditions.
   *
   * @param dataKey - The component's dataKey
   */
  enableComponent(dataKey: string): void {
    this.referenceService.updateComponent(dataKey, 'enable', true);

    // If this is a section/nested, re-evaluate children
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    if (
      component.type === ComponentType.SECTION ||
      component.type === ComponentType.NESTED
    ) {
      this.reevaluateChildren(dataKey);
    }
  }

  /**
   * Get indices of all disabled sections for sidebar navigation.
   * Used to grey out disabled sections in the sidebar.
   */
  getDisabledSectionIndices(): Array<{ parentIndex: number[] }> {
    const [sidebar] = this.stores.sidebar;
    const disabledIndices: Array<{ parentIndex: number[] }> = [];

    for (const section of sidebar.details) {
      if (!section.enable) {
        disabledIndices.push({
          parentIndex: [...section.index],
        });
      }
    }

    return disabledIndices;
  }

  /**
   * Check if a component is enabled.
   *
   * @param dataKey - The component's dataKey
   * @returns Whether the component is enabled
   */
  isEnabled(dataKey: string): boolean {
    const component = this.referenceService.getComponent(dataKey);
    return component?.enable ?? true;
  }

  // ===========================================================================
  // Private Enable Methods
  // ===========================================================================

  /**
   * Evaluate sidebar sections that depend on the source dataKey.
   */
  private evaluateSidebarDependents(sourceDataKey: string): void {
    const [sidebar, setSidebar] = this.stores.sidebar;

    for (let i = 0; i < sidebar.details.length; i++) {
      const section = sidebar.details[i];

      if (!section.componentEnable) continue;

      // Check if this section depends on the source dataKey
      const isDependent = this.isEnableDependent(
        section.componentEnable,
        sourceDataKey
      );

      if (!isDependent) continue;

      // Evaluate the enable condition
      const previousEnable = section.enable;
      const newEnable = this.expressionService.evaluateEnableCondition(
        section.enableCondition || '',
        section.dataKey
      );

      // Update sidebar section
      setSidebar('details', i, 'enable', newEnable);

      // If enable state changed, update all components in the section
      if (newEnable !== previousEnable) {
        this.updateSectionComponents(section, newEnable);
      }
    }
  }

  /**
   * Evaluate components that have enable conditions depending on source dataKey.
   */
  private evaluateComponentDependents(sourceDataKey: string): void {
    const dependents = this.referenceService.getEnableDependents(sourceDataKey);

    for (const dependentKey of dependents) {
      this.evaluateEnable(dependentKey);
    }
  }

  /**
   * Check if an enable dependency array includes the source dataKey.
   */
  private isEnableDependent(
    componentEnable: string[],
    sourceDataKey: string
  ): boolean {
    for (const enableKey of componentEnable) {
      const normalizedKey = this.normalizeDataKey(enableKey, sourceDataKey);
      if (normalizedKey === sourceDataKey) {
        return true;
      }
    }
    return false;
  }

  /**
   * Normalize a dataKey by resolving @$ROW$ markers.
   */
  private normalizeDataKey(enableKey: string, contextDataKey: string): string {
    const parts = enableKey.split('@');
    const keyPart = parts[0];
    const rowMarker = parts[1];

    if (!rowMarker) return enableKey;

    const splitKey = keyPart.split(PATTERNS.NESTED_SEPARATOR);
    const len = splitKey.length;

    switch (rowMarker) {
      case '$ROW$':
        return keyPart;
      case '$ROW1$':
        if (len > 2) splitKey.length = len - 1;
        return splitKey.join(PATTERNS.NESTED_SEPARATOR);
      case '$ROW2$':
        if (len > 3) splitKey.length = len - 2;
        return splitKey.join(PATTERNS.NESTED_SEPARATOR);
      default:
        return enableKey;
    }
  }

  /**
   * Update all components in a section when the section's enable changes.
   */
  private updateSectionComponents(
    section: SidebarDetail,
    enable: boolean
  ): void {
    if (!section.components || !section.components[0]) return;

    const [reference] = this.stores.reference;

    for (const component of section.components[0] as ReferenceDetail[]) {
      const refIndex = this.referenceService.getIndex(component.dataKey);
      if (refIndex === -1) continue;

      if (!enable) {
        // Disable all components in the section
        this.referenceService.updateComponent(component.dataKey, 'enable', false);
      } else {
        // Re-evaluate each component's enable condition
        const ref = reference.details[refIndex];

        // Skip variable components (type 4) - they need special handling
        if (ref.type === ComponentType.VARIABLE) {
          continue;
        }

        let newEnable = true;
        if (ref.enableCondition && ref.enableCondition.trim() !== '') {
          newEnable = this.expressionService.evaluateEnableCondition(
            ref.enableCondition,
            ref.dataKey
          );
        }

        this.referenceService.updateComponent(ref.dataKey, 'enable', newEnable);
      }
    }
  }

  /**
   * Disable all children of a parent component.
   */
  private disableChildren(parentDataKey: string): void {
    const [reference] = this.stores.reference;

    for (const component of reference.details) {
      // Check if component is a child of the parent
      if (
        component.parent === parentDataKey ||
        component.dataKey.startsWith(parentDataKey + PATTERNS.NESTED_SEPARATOR)
      ) {
        this.referenceService.updateComponent(component.dataKey, 'enable', false);
      }
    }
  }

  /**
   * Re-evaluate enable conditions for all children of a parent.
   */
  private reevaluateChildren(parentDataKey: string): void {
    const [reference] = this.stores.reference;

    for (const component of reference.details) {
      // Check if component is a child of the parent
      if (
        component.parent === parentDataKey ||
        component.dataKey.startsWith(parentDataKey + PATTERNS.NESTED_SEPARATOR)
      ) {
        if (component.enableCondition) {
          this.evaluateEnable(component.dataKey);
        } else {
          this.referenceService.updateComponent(component.dataKey, 'enable', true);
        }
      }
    }
  }

  /**
   * Update the disabled sections cache (referenceEnableFalse).
   * This updates the list of disabled sidebar sections for navigation.
   */
  updateDisabledSectionsCache(): void {
    const [sidebar] = this.stores.sidebar;
    const [, setReferenceEnableFalse] = this.stores.referenceEnableFalse;

    const disabledIndices: Array<{ parentIndex: number[] }> = [];

    for (const section of sidebar.details) {
      if (!section.enable) {
        const idx = JSON.parse(JSON.stringify(section.index));
        disabledIndices.push({ parentIndex: idx });
      }
    }

    setReferenceEnableFalse(disabledIndices);
  }
}
