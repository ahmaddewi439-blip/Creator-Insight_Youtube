export const dynamic = "force-dynamic";
export const revalidate = 0;

// ... (biarkan sisa kode Mas Ahmad di bawahnya seperti biasa)
import CreatorInsightApp from "./components/CreatorInsightApp";
import LicenseBanner from "./components/LicenseBanner"; // 👈 INI IMPORT BANNER KITA

export default function Page() {
  return (
    <>
      <LicenseBanner /> 
      <CreatorInsightApp />
    </>
  );
}