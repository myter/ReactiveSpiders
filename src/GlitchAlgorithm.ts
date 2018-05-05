import {Signal} from "./Signal";

export interface GlitchAlgorithm {
    internalSignalChanged(signal : Signal)
}