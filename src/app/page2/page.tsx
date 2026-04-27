import type { Metadata } from "next";
import ThreeDFrameShowcase from "@/components/demos/ThreeDFrameShowcase";

export const metadata: Metadata = {
  title: "3D Demo Page 2 | NoshNurture",
  description: "Pinned showcase layout built around the frame sequence.",
};

export default function Page() {
  return <ThreeDFrameShowcase variant="page2" />;
}
