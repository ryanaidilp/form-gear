import { ComponentType } from '../core/constants';
import {
  evaluateEnableCondition,
  evaluateVariableExpression,
  createGetRowIndex,
  type ExpressionContext,
} from '../utils/expression';

interface InitializationConfig {
  config: any;
  tmpVarComp: any[];
  tmpEnableComp: any[];
  preset: any;
  response: any;
  remark: any;
}

interface InitializationStores {
  sidebar: any;
  reference: any;
  note: any;
  setReference: any;
  setNote: any;
}

interface InitializationServices {
  answer: any;
  reference: any;
  validation: any;
}

interface ValueGetters {
  getValue: (dataKey: string) => unknown;
  getProp: (config: string) => unknown;
}

/**
 * Initialize form data including variables, presets, responses, and enable conditions.
 */
export function initializeFormData(
  props: InitializationConfig,
  stores: InitializationStores,
  services: InitializationServices,
  getters: ValueGetters
): void {
  const { getValue, getProp } = getters;
  const { sidebar, reference, setReference } = stores;

  // Process variable components
  props.tmpVarComp.forEach((element) => {
    let sidePosition = sidebar.details.findIndex((obj: any) => {
      const cekInsideIndex = obj.components[0].findIndex((objChild: any) => {
        objChild.dataKey === element.dataKey;
        return;
      });
      return cekInsideIndex == -1 ? 0 : sidePosition;
    });

    const getRowIndexFn = createGetRowIndex(element.dataKey);
    const context: ExpressionContext = {
      getValue,
      getRowIndex: getRowIndexFn,
      getProp,
      dataKey: element.dataKey,
    };
    let answer = evaluateVariableExpression(element.expression, context);
    if (answer !== undefined) {
      services.answer.saveAnswer(element.dataKey, answer, { isInitial: true, activePosition: sidePosition });
    }
  });

  // Process preset data
  props.preset.details.predata.forEach((element: any, index: number) => {
    let refPosition = services.reference.getIndex(element.dataKey);
    if (refPosition !== -1) {
      if ((props.config.initialMode == 1 && reference.details[refPosition].presetMaster !== undefined && reference.details[refPosition].presetMaster) || props.config.initialMode == 2) {
        let sidePosition = sidebar.details.findIndex((obj: any) => {
          const cekInsideIndex = obj.components[0].findIndex((objChild: any) => objChild.dataKey === element.dataKey);
          return cekInsideIndex == -1 ? 0 : index;
        });
        let answer = typeof element.answer === 'object' ? JSON.parse(JSON.stringify(element.answer)) : element.answer;
        services.answer.saveAnswer(element.dataKey, answer, { isInitial: true, activePosition: sidePosition });
      }
    }
  });

  // Process response answers
  props.response.details.answers.forEach((element: any, index: number) => {
    if (!element.dataKey.includes("#")) {
      let refPosition = services.reference.getIndex(element.dataKey);
      if (refPosition !== -1) {
        let sidePosition = sidebar.details.findIndex((obj: any) => {
          const cekInsideIndex = obj.components[0].findIndex((objChild: any) => objChild.dataKey === element.dataKey);
          return cekInsideIndex == -1 ? 0 : index;
        });
        let answer = typeof element.answer === 'object' ? JSON.parse(JSON.stringify(element.answer)) : element.answer;
        if (answer !== undefined) {
          services.answer.saveAnswer(element.dataKey, answer, { isInitial: true, activePosition: sidePosition });
        }
      }
    }
  });

  // Process enable conditions
  props.tmpEnableComp.forEach((element: any) => {
    const getRowIndexFn = createGetRowIndex(element.dataKey);
    const context: ExpressionContext = {
      getValue,
      getRowIndex: getRowIndexFn,
      getProp,
      dataKey: element.dataKey,
    };
    const default_eval_enable = true;
    let evEnable = evaluateEnableCondition(element.enableCondition, context, default_eval_enable);
    let enable = evEnable === undefined ? false : evEnable;
    services.answer.saveEnable(element.dataKey, enable);
  });

  // Validate and process source options
  for (let index = 0; index < reference.details.length; index++) {
    let obj = reference.details[index];
    if (obj.index[obj.index.length - 2] === 0 && obj.level > 1) continue;

    if (obj.enable && obj.componentValidation !== undefined) {
      services.validation.validateComponent(obj.dataKey);
    }

    if (obj.enable && obj.sourceOption !== undefined) {
      let editedSourceOption = obj.sourceOption.split('@');
      let sourceOptionIndex = services.reference.getIndex(editedSourceOption[0]);
      let sourceOptionObj = sourceOptionIndex !== -1 ? reference.details[sourceOptionIndex] : null;
      if (obj.answer && sourceOptionObj && sourceOptionObj.answer) {
        let x: any[] = [];
        (obj.answer as any[]).forEach((val: any) => {
          (sourceOptionObj.answer as any[]).forEach((op: any) => {
            if (val.value == op.value) x.push(op);
          });
        });
        setReference('details', index, 'answer', x);
      }
    }
  }
}

/**
 * Initialize remarks from the remark store.
 */
export function initializeRemarks(
  stores: InitializationStores,
  remark: any
): void {
  const { reference, note, setNote } = stores;

  reference.details.forEach((e: any) => {
    let remarkPosition = remark.details.notes.findIndex((obj: any) => obj.dataKey === e.dataKey);
    if (remarkPosition !== -1) {
      let newNote = remark.details.notes[remarkPosition];
      let updatedNote = JSON.parse(JSON.stringify(note.details.notes));
      updatedNote.push(newNote);
      setNote('details', 'notes', updatedNote);
    }
  });
}
