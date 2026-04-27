import type { Metadata } from "next";
import ThreeDFrameShowcase from "@/components/demos/ThreeDFrameShowcase";

export const metadata: Metadata = {
  title: "3D Demo Page 3 | NoshNurture",
  description: "Premium intro block with autoplaying frame sequence.",
};

export default function Page() {
  return <ThreeDFrameShowcase variant="page3" />;
}
