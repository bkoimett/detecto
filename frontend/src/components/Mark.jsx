const base = "inline-block relative";

export default function Mark({ className = "" }) {
  return (
    <span aria-hidden className={`${base} ${className}`}>
      <span className="absolute inset-0 rounded-[3px] border-2 border-vision" />
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-vision/35" />
      <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-vision/35" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-vision" />
    </span>
  );
}