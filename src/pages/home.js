import React from "react";
import {
    FeatureGridSection,
    HeroSection,
    SiteShell,
    WorkflowSection,
} from "../components/components";

export default function Home() {
    return (
        <SiteShell>
            <HeroSection />
            <FeatureGridSection />
            <WorkflowSection />
        </SiteShell>
    );
}