import { createContext } from "react";

import { ListId } from "@/bench/config";

// Rows that hold a list of their own (the carousel shelves) nest the same list they live in.
export const ListIdContext = createContext<ListId>("flatlist");
