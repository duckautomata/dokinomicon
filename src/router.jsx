// oxlint-disable react/only-export-components
//
// Router config lives in its own module so `index.jsx` can stay a pure entry
// point. This file still mixes component definitions (the outlet-context
// wrappers below) with module-level side effects (createBrowserRouter), so
// Vite Fast Refresh will full-reload when you edit it, but that's rare.
import { createBrowserRouter, useOutletContext } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home";
import View from "./pages/View";
import Images from "./pages/Images";
import AddDoki from "./pages/AddDoki";
import EditDoki from "./pages/EditDoki";
import Suggestion from "./pages/Suggestion";
import SuggestionStatus from "./pages/SuggestionStatus";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

const HomeRoute = () => {
    const { data } = useOutletContext();
    return <Home data={data} />;
};

const ViewRoute = () => {
    const { data } = useOutletContext();
    return <View data={data} />;
};

const ImagesRoute = () => {
    const { data } = useOutletContext();
    return <Images data={data} />;
};

const AddDokiRoute = () => {
    const { data } = useOutletContext();
    return <AddDoki data={data} />;
};

const EditDokiRoute = () => {
    const { data } = useOutletContext();
    return <EditDoki data={data} />;
};

// Reused on every route so errors in a child render inside the App layout
// (preserving the nav bar), while errors during App's own render fall back to
// the root errorElement which replaces the whole page.
const errorElement = <RouteErrorBoundary />;

export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <App />,
            errorElement,
            children: [
                { index: true, element: <HomeRoute />, errorElement },
                { path: "image", element: <ImagesRoute />, errorElement },
                { path: "view/:doki_id", element: <ViewRoute />, errorElement },
                { path: "add", element: <AddDokiRoute />, errorElement },
                { path: "edit/:doki_id", element: <EditDokiRoute />, errorElement },
                { path: "suggestion", element: <Suggestion />, errorElement },
                { path: "my-suggestions", element: <SuggestionStatus />, errorElement },
            ],
        },
    ],
    { basename: "/dokinomicon/" },
);
