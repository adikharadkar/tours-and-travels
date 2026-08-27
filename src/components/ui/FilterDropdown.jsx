import Dropdown, { DropdownItem } from "./Dropdown";

function FilterDropdown({ label, value, options, onChange }) {
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];
  const isFiltered = value !== "all";

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className={[
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            isFiltered
              ? "bg-cyan-50 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/20"
              : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
          ].join(" ")}
        >
          <span>
            {isFiltered ? `${label}: ${selectedOption.label}` : `${label}`}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-400">
            expand_more
          </span>
        </button>
      }
    >
      <div className="py-1 min-w-[210px] max-h-[300px] overflow-y-auto">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <DropdownItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={
                isSelected
                  ? "font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330]"
              }
            >
              <div className="flex items-center justify-between w-full">
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
                    check
                  </span>
                )}
              </div>
            </DropdownItem>
          );
        })}
      </div>
    </Dropdown>
  );
}

export default FilterDropdown;
