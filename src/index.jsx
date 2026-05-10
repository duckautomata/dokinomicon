// oxlint-disable react/only-export-components
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useOutletContext } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./pages/Home";
import View from "./pages/View";
import Images from "./pages/Images";
import AddDoki from "./pages/AddDoki";
import EditDoki from "./pages/EditDoki";
import Suggestion from "./pages/Suggestion";
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

const router = createBrowserRouter(
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
            ],
        },
    ],
    { basename: "/dokinomicon/" },
);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
