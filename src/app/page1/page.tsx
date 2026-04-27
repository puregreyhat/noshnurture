import type { Metadata } from "next";
import ThreeDFrameShowcase from "@/components/demos/ThreeDFrameShowcase";

export const metadata: Metadata = {
  title: "3D Demo Page 1 | NoshNurture",
  description: "Scroll-scrubbed full-screen hero using the frame sequence.",
};

export default function Page() {
  return <ThreeDFrameShowcase variant="page1" />;
}
