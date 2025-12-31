/**
 * HistoryService
 *
 * Manages undo/redo functionality for form operations.
 * Replaces addHistory and reloadDataFromHistory from GlobalFunction.tsx.
 */

import type {
  FormStores,
  ReferenceDetail,
  SidebarDetail,
  HistoryEntry,
  HistoryState,
} from '../core/types';
import type { ReferenceService } from './ReferenceService';

/**
 * Types of history entries
 */
export type HistoryType =
  | 'saveAnswer'
  | 'insert_ref_detail'
  | 'delete_ref_detail'
  | 'update_sidebar';

/**
 * Insert/delete history data
 */
interface RefDetailHistoryItem {
  pos: number;
  data: string | ReferenceDetail;
}

/**
 * Validation history data
 */
interface ValidationHistoryData {
  validationState: number;
  validationMessage: string[];
}

/**
 * Service for managing form history (undo/redo).
 * Each FormGear instance gets its own HistoryService.
 */
export class HistoryService {
  private stores: FormStores;
  private referenceService: ReferenceService;
  private enabled: boolean = true;
  private referenceHistory: HistoryEntry[] = [];
  private sidebarHistory: SidebarDetail[] = [];

  constructor(stores: FormStores, referenceService: ReferenceService) {
    this.stores = stores;
    this.referenceService = referenceService;
  }

  // ===========================================================================
  // Public History Methods
  // ===========================================================================

  /**
   * Enable or disable history tracking.
   *
   * @param enabled - Whether to enable history
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if history is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add a history entry.
   *
   * @param entry - The history entry to add
   */
  addEntry(entry: HistoryEntry): void {
    if (!this.enabled) return;

    if (entry.type === 'update_sidebar') {
      // Only store sidebar state once (at the beginning)
      if (this.sidebarHistory.length === 0) {
        const [sidebar] = this.stores.sidebar;
        this.sidebarHistory = JSON.parse(JSON.stringify(sidebar.details));
      }
    } else {
      this.referenceHistory.push(entry);
    }
  }

  /**
   * Add a save answer history entry.
   *
   * @param dataKey - The component's dataKey
   * @param position - The position in reference.details
   * @param attribute - The attribute being changed ('answer', 'enable', 'validate')
   * @param previousValue - The previous value before the change
   */
  addSaveAnswerEntry(
    dataKey: string,
    position: number,
    attribute: string,
    previousValue: unknown
  ): void {
    if (!this.enabled) return;

    this.addEntry({
      type: 'saveAnswer',
      dataKey,
      position,
      attribute,
      value: previousValue,
      timestamp: Date.now(),
    });
  }

  /**
   * Add an insert reference detail history entry.
   *
   * @param position - The position of the parent component
   * @param items - Array of inserted items with position and dataKey
   */
  addInsertEntry(
    position: number,
    items: RefDetailHistoryItem[]
  ): void {
    if (!this.enabled) return;

    this.addEntry({
      type: 'insert_ref_detail',
      dataKey: null,
      position,
      attribute: null,
      value: items,
      timestamp: Date.now(),
    });
  }

  /**
   * Add a delete reference detail history entry.
   *
   * @param position - The position of the parent component
   * @param items - Array of deleted items with position and full data
   */
  addDeleteEntry(
    position: number,
    items: RefDetailHistoryItem[]
  ): void {
    if (!this.enabled) return;

    this.addEntry({
      type: 'delete_ref_detail',
      dataKey: null,
      position,
      attribute: null,
      value: items,
      timestamp: Date.now(),
    });
  }

  /**
   * Add a sidebar update history entry.
   */
  addSidebarEntry(): void {
    if (!this.enabled) return;

    this.addEntry({
      type: 'update_sidebar',
      dataKey: null,
      position: null,
      attribute: null,
      value: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Reload data from history (undo all changes).
   * Restores the form to its initial state.
   */
  reloadFromHistory(): void {
    const [, setReference] = this.stores.reference;
    const [reference] = this.stores.reference;
    const [, setSidebar] = this.stores.sidebar;

    // Start with current state
    let details = JSON.parse(JSON.stringify(reference.details)) as ReferenceDetail[];

    // Apply history entries in reverse order
    for (let i = this.referenceHistory.length - 1; i >= 0; i--) {
      const entry = this.referenceHistory[i];

      switch (entry.type) {
        case 'insert_ref_detail':
          details = this.undoInsert(details, entry.value as RefDetailHistoryItem[]);
          break;

        case 'delete_ref_detail':
          details = this.undoDelete(details, entry.value as RefDetailHistoryItem[]);
          break;

        case 'saveAnswer':
          details = this.undoSaveAnswer(
            details,
            entry.dataKey!,
            entry.position!,
            entry.attribute!,
            entry.value
          );
          break;
      }
    }

    // Update reference store
    setReference('details', details);
    this.referenceService.rebuildIndexMap();

    // Restore sidebar if we have history
    if (this.sidebarHistory.length > 0) {
      setSidebar('details', JSON.parse(JSON.stringify(this.sidebarHistory)));
    }
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.referenceHistory = [];
    this.sidebarHistory = [];
  }

  /**
   * Get the number of history entries.
   */
  getEntryCount(): number {
    return this.referenceHistory.length;
  }

  /**
   * Check if there is any history to undo.
   */
  canUndo(): boolean {
    return this.referenceHistory.length > 0;
  }

  // ===========================================================================
  // Private Undo Methods
  // ===========================================================================

  /**
   * Undo an insert operation.
   */
  private undoInsert(
    details: ReferenceDetail[],
    items: RefDetailHistoryItem[]
  ): ReferenceDetail[] {
    // Process in reverse order to maintain correct positions
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      let position = item.pos;

      // Verify the position is correct, or find the right one
      if (details[position]?.dataKey !== item.data) {
        const found = details.findIndex((el) => el.dataKey === item.data);
        if (found !== -1) {
          position = found;
        }
      }

      // Remove the inserted item
      if (position !== -1 && position < details.length) {
        details.splice(position, 1);
      }
    }

    return details;
  }

  /**
   * Undo a delete operation.
   */
  private undoDelete(
    details: ReferenceDetail[],
    items: RefDetailHistoryItem[]
  ): ReferenceDetail[] {
    // Process in reverse order to maintain correct positions
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      // Re-insert the deleted item at its original position
      details.splice(item.pos, 0, JSON.parse(JSON.stringify(item.data)));
    }

    return details;
  }

  /**
   * Undo a save answer operation.
   */
  private undoSaveAnswer(
    details: ReferenceDetail[],
    dataKey: string,
    position: number,
    attribute: string,
    previousValue: unknown
  ): ReferenceDetail[] {
    // Verify the position is correct
    if (details[position]?.dataKey !== dataKey) {
      const found = details.findIndex((el) => el.dataKey === dataKey);
      if (found !== -1) {
        position = found;
      }
    }

    if (position === -1 || position >= details.length) {
      return details;
    }

    // Restore the previous value
    if (attribute === 'answer') {
      details[position].answer = previousValue;
    } else if (attribute === 'enable') {
      details[position].enable = previousValue as boolean;
    } else if (attribute === 'validate') {
      const validationData = previousValue as ValidationHistoryData;
      details[position].validationState = validationData.validationState;
      details[position].validationMessage = JSON.parse(
        JSON.stringify(validationData.validationMessage)
      );
    }

    return details;
  }
}
