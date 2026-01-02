import { createContext, useContext, ParentComponent } from "solid-js";
import { createStore, produce } from "solid-js/store";

interface LoaderItem {
    id: number;
}

interface LoaderState {
    loader: LoaderItem[];
}

interface LoaderDispatch {
    setLoader: (options?: unknown) => void;
    removeLoader: (id: number) => () => void;
}

const LoaderStateContext = createContext<LoaderState>();
const LoaderDispatchContext = createContext<LoaderDispatch>();

const initialState: LoaderState = {
    loader: [],
  };
const FormLoaderProvider: ParentComponent = (props) => {
    const [store, setStore] = createStore(initialState);

    function setLoader(_options?: unknown) {
        setStore(
            "loader",
                produce((loader: LoaderItem[]) => {
                    loader.push({
                        id : 1,
                    });
                })
        );
    }

    const removeLoader = (id: number) => () => {
        setStore(
          "loader",
          produce((loader: LoaderItem[]) => {
            const index = loader.findIndex((s) => s.id === id);
            if (index > -1) {
              loader.splice(index, 1);
            }
          })
        );
      };


    // function removeLoader() {
    //     console.log('rem',store)
    //     setStore("loader", []);
    //     console.log('end rem',store)
    // }

    return (
        <LoaderStateContext.Provider value={store}>
            <LoaderDispatchContext.Provider
                    value={{
                        setLoader,
                        removeLoader
                    }}
                >
                {props.children}
            </LoaderDispatchContext.Provider>
        </LoaderStateContext.Provider>
    );
}


export const useLoaderState = () => useContext(LoaderStateContext);
export const useLoaderDispatch = () => useContext(LoaderDispatchContext);

export default FormLoaderProvider;
