import { configureStore } from "@reduxjs/toolkit";
import deviationReducer from "../features/deviation/deviationSlice";

export const store = configureStore({
  reducer: {
    deviation: deviationReducer,
  },
});

export type RootState = ReturnType<
  typeof store.getState
>;

export type AppDispatch =
  typeof store.dispatch;