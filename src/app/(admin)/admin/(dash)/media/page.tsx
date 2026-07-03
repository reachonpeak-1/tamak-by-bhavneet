import MediaLibrary from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default function MediaPage() {
  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Catalog</span>
          <h1 className="adm-h">Media library</h1>
          <p className="adm-sub">All product images in Firebase Storage</p>
        </div>
      </div>
      <MediaLibrary />
    </>
  );
}
