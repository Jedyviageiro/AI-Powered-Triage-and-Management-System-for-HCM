export default function ModalCloseButton({ onClick, label = "Fechar", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dde1e7] bg-white text-xl font-semibold leading-none text-[#475569] shadow-sm transition hover:border-[#cfd4dc] hover:bg-[#f6f7f9] hover:text-[#161a23] focus:outline-none focus:ring-2 focus:ring-[#0f6e54]/25 ${className}`}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
}
