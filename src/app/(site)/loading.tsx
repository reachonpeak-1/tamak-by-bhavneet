import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
  return (
    <main className="wrap page" aria-busy="true">
      <SkeletonTheme baseColor="#e8e0d5" highlightColor="#f5f0eb">
        <div className="page-head">
          <Skeleton width="9rem" height="1rem" style={{ marginBottom: ".8rem" }} />
          <Skeleton width="16rem" height="2.4rem" />
        </div>
        <div className="grid-prods">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div style={{ aspectRatio: "4/5", width: "100%" }}>
                <Skeleton height="100%" borderRadius="4px" />
              </div>
              <Skeleton height="1rem" style={{ marginTop: ".7rem", width: "80%", display: "block" }} />
              <Skeleton height=".8rem" style={{ marginTop: ".4rem", width: "50%", display: "block" }} />
            </div>
          ))}
        </div>
      </SkeletonTheme>
    </main>
  );
}
