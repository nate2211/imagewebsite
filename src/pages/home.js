import React from "react";
import {
    FeatureGridSection,
    HeroSection,
    SiteShell,
    WorkflowSection,
} from "../components/components";
import Seo from "../components/seo";

export default function Home() {
    return (
        <SiteShell>
            <Seo
                title="Browser Image Editor"
                path="/"
                description="ImageMaster Lab is a professional browser-based image editor for uploading photos, editing on canvas, adding movable text boxes, selections, filters, fills, and exporting polished images."
                keywords="ImageMaster Lab, browser image editor, online image editor, canvas editor, React image editor, photo editor, add text to image, image filters, image selection tool"
            />

            <HeroSection />
            <FeatureGridSection />
            <WorkflowSection />
        </SiteShell>
    );
}