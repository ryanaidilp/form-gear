import { Component, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import FormComponent from './FormComponent';
import { gearVersion } from "./createFormGear";
import { useForm } from "./FormProvider";

import { useLoaderDispatch } from "./loader/FormLoaderProvider";
import {
  useLocale,
  useNote,
  usePrincipal,
  useReference,
  useRemark,
  useResponse,
  useSidebar,
  useSummary,
  useTemplate,
  useCounter,
  useMedia,
  useReferenceEnableFalse,
  useReferenceHistoryEnable,
} from './stores/StoreContext';
import type {
  TemplateState,
  PresetState,
  ResponseState,
  RemarkState,
} from './core/types';

import { toastSuccess, toastError, toastWarning } from "./utils/toast";
import { useServices } from "./services";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ClientMode, ComponentType } from "./core/constants";
import {
  isMobileDevice,
  resetScrollPosition,
  scrollToComponent,
  findSidebarIndex,
  closeAllModalsWithAnimation,
  closeModalWithAnimation,
  ModalClasses,
} from './utils';
import type { ActiveComponentData } from './utils';

// Extracted components
import {
  ListModal,
  SubmitModal,
  ErrorWarningModal,
  FormSidebar,
  NavigationBar,
  FormHeader,
  FormConfigError,
  RemarkIcon,
  BlankIcon,
} from './components';
import type { ListItem } from './components';
import { useListPagination, initializeFormData, initializeRemarks } from './hooks';

// =============================================================================
// Types
// =============================================================================

interface FormProps {
  config: any;
  timeStart: any;
  runAll: number;
  tmpEnableComp: [] | any;
  tmpVarComp: [] | any;
  template: TemplateState | any;
  preset: PresetState | any;
  response: ResponseState | any;
  validation: any;
  remark: RemarkState | any;
  uploadHandler: any;
  GpsHandler: any;
  offlineSearch: any;
  onlineSearch: any;
  mobileExit: any;
  setResponseMobile: any;
  setSubmitMobile: any;
  openMap: any;
}

// =============================================================================
// Main Component
// =============================================================================

const Form: Component<FormProps> = props => {
  // Services
  const services = useServices();

  // Store hooks
  const [locale, setLocale] = useLocale();
  const [note, setNote] = useNote();
  const [principal, setPrincipal] = usePrincipal();
  const [reference, setReference] = useReference();
  const [remark, setRemark] = useRemark();
  const [response, setResponse] = useResponse();
  const [sidebar] = useSidebar();
  const [summary, setSummary] = useSummary();
  const [template] = useTemplate();
  const [counter] = useCounter();
  const [media, setMedia] = useMedia();
  const [referenceEnableFalse] = useReferenceEnableFalse();
  const [, setReferenceHistoryEnable] = useReferenceHistoryEnable();

  // =============================================================================
  // Helper Functions
  // =============================================================================

  const getValue = (dataKey: string): unknown => {
    const componentIndex = reference.details.findIndex(obj => obj.dataKey === dataKey);
    let answer: unknown = '';
    if (componentIndex !== -1 && reference.details[componentIndex].answer && reference.details[componentIndex].enable) {
      answer = reference.details[componentIndex].answer;
    }
    return answer;
  };

  const getConfig = () => props.config;

  const getProp = (config: string) => {
    switch (config) {
      case 'clientMode': return props.config.clientMode;
      case 'baseUrl': return props.config.baseUrl;
    }
  };

  // =============================================================================
  // State
  // =============================================================================

  const [renderGear, setRenderGear] = createSignal('FormGear-' + gearVersion + ' 🚀:');
  const { setLoader, removeLoader } = useLoaderDispatch();
  const [config, setConfig] = createSignal(getConfig());
  const [form, { setActiveComponent }] = useForm();

  // Modal states
  const [showSubmit, setShowSubmit] = createSignal(false);
  const [showError, setShowError] = createSignal(false);
  const [showRemark, setShowRemark] = createSignal(false);
  const [showBlank, setShowBlank] = createSignal(false);

  // Captcha state
  const [captcha, setCaptcha] = createSignal('');
  const [tmpCaptcha, setTmpCaptcha] = createSignal('');
  const [docState, setDocState] = createSignal('E');

  // Pagination hooks for lists
  const errorPagination = useListPagination<ListItem>();
  const warningPagination = useListPagination<ListItem>();
  const blankPagination = useListPagination<ListItem>();
  const remarkPagination = useListPagination<ListItem>();

  // Scroll state
  const [showScrollWeb, setShowScrollWeb] = createSignal(false);
  const [showScrollMobile, setShowScrollMobile] = createSignal(false);

  // Mobile detection
  const [onMobile, setOnMobile] = createSignal(isMobileDevice());

  // Components for current section
  const [components, setComponents] = createSignal<unknown[]>([]);

  // =============================================================================
  // Initialization
  // =============================================================================

  // Update locale if template provides language
  if (props.template.details.language !== undefined && props.template.details.language.length > 0) {
    const keys = Object.keys(locale.details.language[0]);
    const updatedLocale = JSON.parse(JSON.stringify(locale.details.language[0]));
    keys.forEach(k => {
      if (props.template.details.language[0].hasOwnProperty(k)) {
        updatedLocale[k] = props.template.details.language[0][k];
      }
    });
    setLocale('details', 'language', [updatedLocale]);
  }

  const getComponents = (dataKey: string): unknown[] => {
    const componentIndex = sidebar.details.findIndex(obj => obj.dataKey === dataKey);
    return sidebar.details[componentIndex]?.components[0] ?? [];
  };

  // Check sidebar configuration
  if (!sidebar.details || sidebar.details.length === 0) {
    console.error('FormGear Error: No sections found in sidebar. Please check your template configuration.');
    toastError('Form configuration error: No sections found in template', 5000);
    return <FormConfigError />;
  }

  // Initialize active component
  const initialComponent = {
    dataKey: sidebar.details[0].dataKey,
    label: sidebar.details[0].label,
    index: JSON.parse(JSON.stringify(sidebar.details[0].index)),
    position: 0
  };
  setActiveComponent(initialComponent);
  history.replaceState(initialComponent, '');
  setComponents(getComponents(sidebar.details[0].dataKey));

  // Initialize form data using extracted function
  if (props.runAll == 0) {
    initializeFormData(
      { config: props.config, tmpVarComp: props.tmpVarComp, tmpEnableComp: props.tmpEnableComp, preset: props.preset, response: props.response, remark: props.remark },
      { sidebar, reference, note, setReference, setNote },
      { answer: services.answer, reference: services.reference, validation: services.validation },
      { getValue, getProp }
    );
  } else {
    initializeRemarks({ reference, note, setNote, sidebar, setReference }, props.remark);
    setRenderGear('FormGear-' + gearVersion + ' ♻️:');
  }

  setReferenceHistoryEnable(true);

  // =============================================================================
  // Effects
  // =============================================================================

  const checkOnMobile = () => {
    window.innerWidth < 768 ? setOnMobile(true) : setOnMobile(false);
  };

  createEffect(() => {
    setComponents(getComponents(form.activeComponent.dataKey));

    let _answer = 0, _error = 0, _blank = 0, _clean = 0;
    reference.details.forEach((element) => {
      let enableFalse = referenceEnableFalse().findIndex(obj => obj.parentIndex.toString() === element.index.slice(0, -2).toString());
      if (enableFalse == -1 && element.type > ComponentType.VARIABLE && element.enable) {
        // Check for answered questions
        if (element.answer !== undefined && element.answer !== '' && element.answer !== null) {
          _answer += 1;
          if (element.validationState != 1 && element.validationState != 2) {
            _clean += 1;
          }
        }

        // Check for blank questions (same logic as showListBlank)
        const isBlank = (element.answer === undefined || element.answer === '') ||
          (element.type === ComponentType.LIST_TEXT_REPEAT && Array.isArray(element.answer) && element.answer.length === 1) ||
          (element.type === ComponentType.LIST_SELECT_REPEAT && Array.isArray(element.answer) && element.answer.length === 1);
        const isNestedFirstRow = JSON.parse(JSON.stringify(element.index[element.index.length - 2])) === 0 && element.level > 1;

        if (isBlank && !isNestedFirstRow) {
          _blank += 1;
        }

        if (element.validationState == 2) {
          _error += 1;
        }
      }
    });

    setSummary({
      answer: _answer,
      blank: _blank,
      error: _error,
      remark: note.details.notes.length,
      clean: _clean
    });

    if (getConfig().clientMode != 2) {
      window.addEventListener('resize', checkOnMobile);
    }

    document.getElementById("FormGear-loader")?.classList.add('hidden');
  });

  // =============================================================================
  // UI Handlers
  // =============================================================================

  const toggleSwitch = () => {
    document.documentElement.classList.toggle('dark');
    document.querySelector(".outer-span")?.classList.toggle("translate-x-5");
    document.querySelector(".button-switch")?.classList.toggle("bg-gray-800");
    document.querySelector(".light-switch")?.classList.toggle("opacity-100");
    document.querySelector(".dark-switch")?.classList.toggle("opacity-100");
  };

  const sidebarCollapse = (event: MouseEvent) => {
    const sidebarEl = document.querySelector(".sidebar-span");
    const overlay = document.querySelector(".sidebar-overlay");
    sidebarEl?.classList.toggle("-translate-x-full");
    sidebarEl?.classList.toggle("translate-x-0");
    overlay?.classList.toggle("opacity-0");
    overlay?.classList.toggle("opacity-100");
    overlay?.classList.toggle("pointer-events-none");
    overlay?.classList.toggle("pointer-events-auto");
  };

  const checkScrollTopWeb = () => {
    const component = document.querySelector(".component-div");
    setShowScrollWeb(component ? component.scrollTop > 100 : false);
  };

  const checkScrollTopMobile = () => {
    if (isMobileDevice()) {
      const component = document.querySelector(".mobile-component-div");
      setShowScrollMobile(component ? component.scrollTop > 100 : false);
    }
  };

  const scrollToTop = () => {
    const component = isMobileDevice()
      ? document.querySelector(".mobile-component-div")
      : document.querySelector(".component-div");
    window.scrollTo({ top: 0, behavior: "smooth" });
    component?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================================================================
  // Data Management
  // =============================================================================

  const setData = () => {
    const dataForm = [];
    const dataMedia = [];
    const dataPrincipal = [];

    setLoader({});
    setTimeout(() => services.enable.updateDisabledSectionsCache(), 50);

    reference.details.forEach((element) => {
      if (element.type > 3 && element.enable && element.answer !== undefined && element.answer !== '' && element.answer !== null) {
        let enableFalse = referenceEnableFalse().findIndex(obj => obj.parentIndex.toString() === element.index.slice(0, -2).toString());
        if (enableFalse == -1) {
          if (element.type === ComponentType.PHOTO || element.type === ComponentType.SIGNATURE) {
            dataMedia.push({ dataKey: element.dataKey, name: element.name, answer: element.answer });
          }
          dataForm.push({ dataKey: element.dataKey, name: element.name, answer: element.answer });

          if (element.principal !== undefined) {
            dataPrincipal.push({
              dataKey: element.dataKey,
              name: element.name,
              answer: element.answer,
              principal: element.principal,
              columnName: element.columnName
            });
          }
        }
      }
    });

    // Set response
    setResponse('details', 'answers', dataForm);
    setResponse('details', 'templateDataKey', template.details.dataKey);
    setResponse('details', 'gearVersion', gearVersion);
    setResponse('details', 'templateVersion', props.template.details.version || '0.0.0');
    setResponse('details', 'validationVersion', props.validation.details.version || '0.0.0');
    setResponse('details', 'docState', docState());
    setResponse('details', 'summary', JSON.parse(JSON.stringify(summary)));
    setResponse('details', 'counter', [JSON.parse(JSON.stringify(counter))]);

    // Timestamp handling
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const dt = new Date();
    const timeToGet = Number((dt.getTimezoneOffset() / 60) * -1);
    dayjs.extend(timezone);
    dayjs.extend(utc);
    const tz = dayjs.tz.guess();

    // Set timestamps for response, media, principal, remark
    setTimestamps(setResponse, response, tz, timeToGet, now);
    setTimestamps(setMedia, principal, tz, timeToGet, now);
    setTimestamps(setPrincipal, principal, tz, timeToGet, now);
    setTimestamps(setRemark, remark, tz, timeToGet, now);

    // Set media
    setMedia('details', 'media', dataMedia);
    setMedia('details', 'templateDataKey', template.details.dataKey);
    setMedia('details', 'gearVersion', gearVersion);
    setMedia('details', 'templateVersion', props.template.details.version || '0.0.0');
    setMedia('details', 'validationVersion', props.validation.details.version || '0.0.0');

    // Set principal
    setPrincipal('details', 'principals', dataPrincipal);
    setPrincipal('details', 'templateDataKey', template.details.dataKey);
    setPrincipal('details', 'gearVersion', gearVersion);
    setPrincipal('details', 'templateVersion', props.template.details.version || '0.0.0');
    setPrincipal('details', 'validationVersion', props.validation.details.version || '0.0.0');

    // Set remark
    setRemark('details', 'notes', JSON.parse(JSON.stringify(note.details.notes)));
    setRemark('details', 'templateDataKey', template.details.dataKey);
    setRemark('details', 'gearVersion', gearVersion);
    setRemark('details', 'templateVersion', props.template.details.version || '0.0.0');
    setRemark('details', 'validationVersion', props.validation.details.version || '0.0.0');

    // Set reference sidebar
    setReference('sidebar', sidebar.details);
  };

  function setTimestamps(setter: any, store: any, tz: string, timeToGet: number, now: string) {
    const isNew = store.details.createdBy === undefined || store.details.createdBy === '';
    if (isNew) {
      setter('details', 'createdBy', getConfig().username);
      setter('details', 'createdAt', now);
      setter('details', 'createdAtTimezone', tz.toString());
      setter('details', 'createdAtGMT', timeToGet);
    } else {
      setter('details', 'updatedBy', getConfig().username);
      setter('details', 'updatedAt', now);
      setter('details', 'updatedAtTimezone', tz.toString());
      setter('details', 'updatedAtGMT', timeToGet);
      if (!store.details.createdAtTimezone) {
        setter('details', 'createdAtTimezone', tz.toString());
        setter('details', 'createdAtGMT', timeToGet);
      }
    }
  }

  const writeResponse = () => {
    setData();
    props.setResponseMobile(response.details, media.details, remark.details, principal.details, reference);
  };

  const writeSubmitResponse = () => {
    setData();
    props.setSubmitMobile(response.details, media.details, remark.details, principal.details, reference);
  };

  props.mobileExit(writeResponse);

  // =============================================================================
  // Browser History Navigation
  // =============================================================================

  const isSectionState = (state: unknown): state is ActiveComponentData =>
    typeof state === 'object' &&
    state !== null &&
    typeof (state as ActiveComponentData).dataKey === 'string' &&
    typeof (state as ActiveComponentData).label === 'string' &&
    Array.isArray((state as ActiveComponentData).index) &&
    typeof (state as ActiveComponentData).position === 'number';

  /**
   * Navigates to a section and records a browser history entry.
   * Do NOT call this from within a popstate handler — use setActiveComponent
   * directly to avoid creating duplicate history entries during back/forward navigation.
   */
  const navigateToSection = (component: ActiveComponentData) => {
    setActiveComponent(component);
    history.pushState(component, '' /* title param: deprecated, ignored by browsers */);
  };

  const handlePopState = (event: PopStateEvent) => {
    if (isSectionState(event.state)) {
      writeResponse();
      setLoader({});
      setTimeout(() => {
        setActiveComponent(event.state);
        resetScrollPosition();
      }, 50);
    }
  };

  onMount(() => {
    // Expose mobileBack for Flutter/native WebView back-button interception.
    // The Flutter SDK calls window.mobileBack() and expects:
    //   true  → navigation handled (more sections to go back through)
    //   false → at first section, let the native layer handle (show exit dialog)
    (window as any).mobileBack = (): boolean => {
      const hasPrev = sidebar.details.filter(
        (obj: any, i: number) => obj.enable && i < form.activeComponent.position
      ).length > 0;
      if (hasPrev) {
        history.back(); // triggers popstate → handlePopState
        return true;
      }
      return false;
    };

    window.addEventListener('popstate', handlePopState);
    onCleanup(() => {
      delete (window as any).mobileBack;
      window.removeEventListener('popstate', handlePopState);
    });
  });

  // =============================================================================
  // Navigation
  // =============================================================================

  const hasPreviousSections = () => sidebar.details.filter((obj, i) => obj.enable && i < form.activeComponent.position).length > 0;
  const hasNextSections = () => sidebar.details.filter((obj, i) => obj.enable && i > form.activeComponent.position).length > 0;

  const previousPage = (_event: MouseEvent): void => {
    writeResponse();
    const enabledPrevSections = sidebar.details.filter((obj, i) => obj.enable && i < form.activeComponent.position);
    if (enabledPrevSections.length === 0) return;

    const prevSection = enabledPrevSections[enabledPrevSections.length - 1];
    const prevIndex = sidebar.details.findIndex(obj => obj.dataKey === prevSection.dataKey);

    setLoader({});
    setTimeout(() => {
      navigateToSection({
        dataKey: prevSection.dataKey,
        label: prevSection.label,
        index: JSON.parse(JSON.stringify(prevSection.index)),
        position: prevIndex,
      });
    }, 50);
    resetScrollPosition();
  };

  const nextPage = (_event: MouseEvent): void => {
    writeResponse();
    const enabledNextSections = sidebar.details.filter((obj, i) => obj.enable && i > form.activeComponent.position);
    if (enabledNextSections.length === 0) return;

    const nextSection = enabledNextSections[0];
    const nextIndex = sidebar.details.findIndex(obj => obj.dataKey === nextSection.dataKey);

    setLoader({});
    setTimeout(() => {
      navigateToSection({
        dataKey: nextSection.dataKey,
        label: nextSection.label,
        index: JSON.parse(JSON.stringify(nextSection.index)),
        position: nextIndex,
      });
    }, 50);
    resetScrollPosition();
  };

  const handleSidebarSelect = (dataKey: string, label: string, index: number[], position: number) => {
    const component = document.querySelector(".component-div");
    window.scrollTo({ top: 0, behavior: "smooth" });
    component?.scrollTo({ top: 0, behavior: "smooth" });
    writeResponse();
    setLoader({});
    setTimeout(() => navigateToSection({ dataKey, label, index: JSON.parse(JSON.stringify(index)), position }), 50);
  };

  // =============================================================================
  // Modal Handlers
  // =============================================================================

  const lookInto = (_e: MouseEvent, sidebarIndex: number[], dataKey: string): void => {
    const sidebarIntoIndex = findSidebarIndex(sidebar.details, sidebarIndex);
    const sidebarInto = sidebar.details[sidebarIntoIndex];

    closeAllModalsWithAnimation([
      { className: ModalClasses.ERROR, setShowFn: setShowError },
      { className: ModalClasses.REMARK, setShowFn: setShowRemark },
      { className: ModalClasses.BLANK, setShowFn: setShowBlank },
    ]);

    const sidebarElement = document.querySelector(".sidebar-span");
    const isSidebarOpen = sidebarElement?.classList.contains("translate-x-0");
    if (isMobileDevice() && isSidebarOpen) {
      sidebarCollapse(_e);
    }

    setLoader({});
    setTimeout(() => {
      navigateToSection({
        dataKey: sidebarInto.dataKey,
        label: sidebarInto.label,
        index: JSON.parse(JSON.stringify(sidebarInto.index)),
        position: sidebarIntoIndex,
      });
      scrollToComponent(dataKey);
    }, 250);
  };

  const showListError = (event: MouseEvent) => {
    const filteredError: ListItem[] = [];
    const filteredWarning: ListItem[] = [];

    reference.details.forEach((element) => {
      const enableFalse = referenceEnableFalse().findIndex(obj => obj.parentIndex.toString() === element.index.slice(0, -2).toString());
      if (enableFalse == -1) {
        const sidebarIndex = element.level > 1 ? element.index.slice(0, -1) : element.index.slice(0, -2);
        if (element.type > 4 && element.enable && element.validationState == 2) {
          filteredError.push({ label: element.label, message: element.validationMessage, sideIndex: sidebarIndex, dataKey: element.dataKey });
        }
        if (element.type > 4 && element.enable && element.validationState == 1) {
          filteredWarning.push({ label: element.label, message: element.validationMessage, sideIndex: sidebarIndex, dataKey: element.dataKey });
        }
      }
    });

    errorPagination.setItems(filteredError);
    warningPagination.setItems(filteredWarning);
    setShowError(true);
  };

  const showListRemark = (event: MouseEvent) => {
    const remarkCollection: ListItem[] = [];
    note.details.notes.forEach(el => {
      const lookup = reference.details.find(obj => obj.dataKey == el.dataKey);
      if (lookup) {
        const sidebarIndex = lookup.level > 1 ? lookup.index.slice(0, -1) : lookup.index.slice(0, -2);
        remarkCollection.push({ label: lookup.label, sideIndex: sidebarIndex, dataKey: lookup.dataKey });
      }
    });
    remarkPagination.setItems(remarkCollection);
    setShowRemark(true);
  };

  const showListBlank = (event: MouseEvent) => {
    const blankCollection: ListItem[] = [];
    reference.details.forEach((element) => {
      const enableFalse = referenceEnableFalse().findIndex(obj => obj.parentIndex.toString() === element.index.slice(0, -2).toString());
      if (enableFalse == -1) {
        if ((element.type > ComponentType.VARIABLE) && element.enable &&
          ((element.answer === undefined || element.answer === '') ||
            (element.type === ComponentType.LIST_TEXT_REPEAT && Array.isArray(element.answer) && element.answer.length === 1) ||
            (element.type === ComponentType.LIST_SELECT_REPEAT && Array.isArray(element.answer) && element.answer.length === 1)) &&
          !(JSON.parse(JSON.stringify(element.index[element.index.length - 2])) === 0 && element.level > 1)) {
          const sidebarIndex = element.level > 1 ? element.index.slice(0, -1) : element.index.slice(0, -2);
          blankCollection.push({ label: element.label, sideIndex: sidebarIndex, dataKey: element.dataKey });
        }
      }
    });
    blankPagination.setItems(blankCollection);
    setShowBlank(true);
  };

  // =============================================================================
  // Validation & Submit
  // =============================================================================

  const revalidateQ = () => {
    reference.details.forEach((object, ind) => {
      const updatedRef = JSON.parse(JSON.stringify(object));
      const enableFalse = referenceEnableFalse().findIndex(obj => obj.parentIndex.toString() === updatedRef.index.slice(0, -2).toString());
      if (enableFalse == -1 && updatedRef.enable && updatedRef.required) {
        const editedDataKey = updatedRef.dataKey.split('@');
        const newEdited = editedDataKey[0].split('#');
        if (updatedRef.level < 2 || (updatedRef.level > 1 && newEdited[1] !== undefined)) {
          const typeAnswer = typeof updatedRef.answer;
          if (updatedRef.answer === undefined ||
            (typeAnswer === 'string' && updatedRef.answer === '') ||
            (typeAnswer === 'number' && updatedRef.answer == 0) ||
            (typeAnswer === 'object' && Number(updatedRef.type) == 21 && updatedRef.answer.length < 2) ||
            (typeAnswer === 'object' && Number(updatedRef.type) == 22 && updatedRef.answer.length < 2) ||
            (typeAnswer === 'object' && updatedRef.type > 22 && updatedRef.answer.length == 0) ||
            (typeAnswer === 'object' && !isNaN(updatedRef.answer)) ||
            (typeAnswer === 'number' && isNaN(updatedRef.answer)) ||
            JSON.stringify(updatedRef.answer) === '[]') {
            updatedRef.validationMessage.push(locale.details.language[0].validationRequired);
            updatedRef.validationState = 2;
          }
          setReference('details', ind, updatedRef);
        }
      }
    });
  };

  const revalidateError = (event: MouseEvent) => {
    setLoader({});
    setTimeout(() => services.enable.updateDisabledSectionsCache(), 50);
    if (summary.error > 0) {
      showListError(event);
    }
  };

  const checkDocState = () => {
    if (summary.error > 0) {
      setDocState('E');
    } else if (reference.details.filter(element => Number(element.validationState) === 1).length > 0) {
      setDocState('W');
    } else {
      setDocState('C');
    }
  };

  const createCaptcha = () => {
    const captchaStr = [];
    for (let q = 0; q < 6; q++) {
      captchaStr[q] = Math.floor(Math.random() * 10);
    }
    setCaptcha(captchaStr.join(""));
  };

  const confirmSave = (_event: MouseEvent) => {
    setLoader({});
    setTimeout(() => services.enable.updateDisabledSectionsCache(), 50);
    writeResponse();
    toastSuccess('Data saved', 1500);
  };

  const confirmSubmit = (event: MouseEvent) => {
    createCaptcha();
    checkDocState();
    if (docState() === 'E') {
      toastError(locale.details.language[0].submitInvalid, 3000);
    } else {
      setLoader({});
      setTimeout(() => services.enable.updateDisabledSectionsCache(), 50);
      revalidateQ();
      if (summary.error === 0) {
        if (docState() === 'W') {
          toastWarning(locale.details.language[0].submitWarning, 3000);
        }
        setShowSubmit(true);
      } else {
        toastError(locale.details.language[0].submitEmpty, 3000);
      }
    }
  };

  const submitData = (event: MouseEvent) => {
    if (tmpCaptcha().length !== 0 && tmpCaptcha() === captcha()) {
      writeSubmitResponse();
      closeModalWithAnimation(ModalClasses.CONFIRMATION, setShowSubmit);
      toastSuccess(locale.details.language[0].verificationSubmitted, 3000);
    } else {
      toastError(locale.details.language[0].verificationInvalid, 3000);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  const timeDiff = new Date().getTime() - props.timeStart.getTime();

  return (
    <div class="bg-gray-200 dark:bg-[#181f30] h-screen">
      {/* Submit Modal */}
      <SubmitModal
        show={showSubmit()}
        setShow={setShowSubmit}
        captcha={captcha()}
        onRefreshCaptcha={createCaptcha}
        onCaptchaChange={setTmpCaptcha}
        onSubmit={submitData}
      />

      {/* Remark Modal */}
      <ListModal
        show={showRemark()}
        setShow={setShowRemark}
        modalClass="modal-remark"
        title="List Remark"
        icon={<RemarkIcon />}
        iconBgClass="text-yellow-400 bg-yellow-100"
        items={remarkPagination.pageItems()}
        totalItems={remarkPagination.totalItems()}
        currentPage={remarkPagination.currentPage()}
        maxPage={remarkPagination.maxPage()}
        onPageChange={remarkPagination.setPage}
        onItemClick={lookInto}
      />

      {/* Blank Modal */}
      <ListModal
        show={showBlank()}
        setShow={setShowBlank}
        modalClass="modal-confirmation modal-blank"
        title="List Blank"
        icon={<BlankIcon />}
        iconBgClass="bg-gray-200 text-gray-500"
        items={blankPagination.pageItems()}
        totalItems={blankPagination.totalItems()}
        currentPage={blankPagination.currentPage()}
        maxPage={blankPagination.maxPage()}
        onPageChange={blankPagination.setPage}
        onItemClick={lookInto}
      />

      {/* Error/Warning Modal */}
      <ErrorWarningModal
        show={showError()}
        setShow={setShowError}
        errorItems={errorPagination.pageItems()}
        errorTotalItems={errorPagination.totalItems()}
        errorCurrentPage={errorPagination.currentPage()}
        errorMaxPage={errorPagination.maxPage()}
        onErrorPageChange={errorPagination.setPage}
        warningItems={warningPagination.pageItems()}
        warningTotalItems={warningPagination.totalItems()}
        warningCurrentPage={warningPagination.currentPage()}
        warningMaxPage={warningPagination.maxPage()}
        onWarningPageChange={warningPagination.setPage}
        onItemClick={lookInto}
      />

      {/* Main Content */}
      <div class="overflow-hidden">
        <div class="bg-gray-50 dark:bg-gray-900 dark:text-white h-screen shadow-xl text-gray-600 flex overflow-hidden text-sm font-sans xl:rounded-xl dark:shadow-gray-800">
          <div class="flex-grow overflow-hidden h-full flex flex-col bg-white dark:bg-gray-900 z-0">
            <div class="mobile-component-div relative h-screen md:flex md:overflow-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-500 overflow-y-scroll scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
              onScroll={checkScrollTopMobile}>

              {/* Sidebar */}
              <FormSidebar
                sidebarDetails={sidebar.details}
                activeDataKey={form.activeComponent.dataKey}
                activeIndex={form.activeComponent.index}
                templateAcronym={props.template.details.acronym}
                templateVersion={props.template.details.version || '0.0.0'}
                validationVersion={props.validation.details.version || '0.0.0'}
                clientMode={getConfig().clientMode}
                summary={summary}
                locale={locale.details.language[0]}
                formMode={config().formMode}
                onSelect={handleSidebarSelect}
                onSidebarCollapse={sidebarCollapse}
                onWriteResponse={writeResponse}
                onShowBlank={showListBlank}
                onShowError={revalidateError}
                onShowRemark={showListRemark}
                onSubmit={confirmSubmit}
              />

              {/* Component Area */}
              <div class="component-div min-h-screen flex-grow bg-white dark:bg-gray-900 z-10 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-500 overflow-y-visible md:overflow-y-scroll scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
                onScroll={checkScrollTopWeb}>

                {/* Header */}
                <FormHeader
                  template={props.template}
                  config={getConfig()}
                  onMobile={onMobile()}
                  renderGear={renderGear()}
                  timeDiff={timeDiff}
                  onToggleTheme={toggleSwitch}
                  onSidebarCollapse={sidebarCollapse}
                  sidebar={sidebar}
                  form={form}
                  onSelectTab={(dataKey, label, index, position) => {
                    resetScrollPosition();
                    getConfig().clientMode === ClientMode.CAPI && writeResponse();
                    setLoader({});
                    setTimeout(() => navigateToSection({ dataKey, label, index: JSON.parse(JSON.stringify(index)), position }), 50);
                  }}
                />

                {/* Form Components */}
                <FormComponent
                  onMobile={onMobile()}
                  components={components()}
                  dataKey={form.activeComponent.dataKey}
                  index={[0]}
                  config={getConfig()}
                  uploadHandler={props.uploadHandler}
                  GpsHandler={props.GpsHandler}
                  offlineSearch={props.offlineSearch}
                  onlineSearch={props.onlineSearch}
                  openMap={props.openMap}
                  setResponseMobile={props.setResponseMobile}
                />

                {/* Desktop Navigation */}
                <Show when={!onMobile()}>
                  <NavigationBar
                    activeLabel={form.activeComponent.label}
                    hasPrevious={hasPreviousSections()}
                    hasNext={hasNextSections()}
                    hasErrors={summary.error > 0}
                    canSubmit={summary.error === 0}
                    isMobile={false}
                    showScrollTop={showScrollWeb()}
                    formMode={config().formMode}
                    onPrevious={previousPage}
                    onNext={nextPage}
                    onShowError={showListError}
                    onSubmit={confirmSubmit}
                    onScrollTop={scrollToTop}
                  />
                </Show>
              </div>

              {/* Mobile Navigation */}
              <Show when={onMobile()}>
                <NavigationBar
                  activeLabel={form.activeComponent.label}
                  hasPrevious={hasPreviousSections()}
                  hasNext={hasNextSections()}
                  hasErrors={summary.error > 0}
                  canSubmit={summary.error === 0}
                  isMobile={true}
                  showScrollTop={showScrollMobile()}
                  formMode={config().formMode}
                  onPrevious={previousPage}
                  onNext={nextPage}
                  onShowError={showListError}
                  onSubmit={confirmSubmit}
                  onScrollTop={scrollToTop}
                  onSave={confirmSave}
                />
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form;
