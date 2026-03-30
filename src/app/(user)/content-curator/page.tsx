import ProductAsset from "./components/ProductAsset";
import SkillConfig from "./components/SkillConfig";
import KeywordBank from "./components/KeywordBank";
import ContentCanvas from "./components/ContentCanvas";

export default function ContentCuratorPage() {
  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left Column (3/12) */}
      <div className="flex flex-col gap-6 lg:col-span-3">
        <ProductAsset />
        <SkillConfig />
      </div>

      {/* Middle Column (3/12) */}
      <div className="flex flex-col lg:col-span-4 xl:col-span-3 min-h-[600px] h-full">
        <KeywordBank />
      </div>

      {/* Right Column (6/12) - The main canvas */}
      <div className="flex flex-col lg:col-span-5 xl:col-span-6">
        <ContentCanvas />
      </div>
    </div>
  );
}
