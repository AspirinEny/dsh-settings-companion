/**
 * dsh-settings-companion — a second column on the sidebar account row.
 *
 * The row keeps its official AccountMenu on the left (avatar + account name) and gains a
 * "gear + 设置" column on the right that opens the settings panel.
 *
 * Why a portal instead of a slot: `settings.launcher` is a `single` slot, so the first
 * registrant (the official AccountMenu) always wins and cannot be replaced. This plugin
 * therefore renders nothing in its own slot position and portals the column into the row
 * that hosts the launcher. The row becomes a flex container through `:has()` and the
 * launcher wrapper collapses to `display:contents`, which makes our button a real sibling
 * of the account menu.
 *
 * Styling strategy: the button copies the account menu's own CSS-module class names at
 * runtime, so height, radius, colours, typography, hover and the 36x36 collapsed state are
 * inherited from the official stylesheet instead of being duplicated here. Only layout
 * gaps and the wider horizontal padding are declared locally.
 */
window.__ModuleLoader__.load({
	id: "dsh-settings-companion",
	factory: (require) => {
		const react = require("react");
		const reactDom = require("react-dom");
		const h = react.createElement;

		const STYLE_ID = "dsh-settings-companion/style";
		const SLOT = "sidebar.footer.action";
		const NS = "settings.companion";
		const LAUNCHER = "[data-slot=\"settings.launcher\"]";
		const COLUMN_CLASS = "dsh-settings-column";
		const ICON_SIZE = 16;
		const CLICK_GUARD_MS = 150;
		const POLL_MS = 1500;

		const CSS = `
:has(> ${LAUNCHER}){display:flex!important;align-items:center;gap:2px}
${LAUNCHER}{display:contents!important;min-width:0}
${LAUNCHER}>*{flex:1 1 auto;min-width:0}
.${COLUMN_CLASS}{display:flex;align-items:center;justify-content:center;box-sizing:border-box;height:44px;border:0;border-radius:var(--dsw-radius-md);background:0 0;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:normal;white-space:nowrap;cursor:pointer;user-select:none;-webkit-appearance:none;appearance:none}
.${COLUMN_CLASS}.${COLUMN_CLASS}{flex:0 0 auto;width:auto;min-width:0;margin-left:auto;gap:8px;padding:6px 14px}
.${COLUMN_CLASS}.${COLUMN_CLASS}:hover,.${COLUMN_CLASS}.${COLUMN_CLASS}:active{background:var(--dsw-alias-interactive-bg-hover)}
.${COLUMN_CLASS}.${COLUMN_CLASS}:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:1px}
.${COLUMN_CLASS}.${COLUMN_CLASS}[data-signed-out="true"]:not([data-collapsed="true"]){padding:6px 14px}
.${COLUMN_CLASS} svg{flex:0 0 auto}
.${COLUMN_CLASS}[data-collapsed="true"]{flex:0 0 auto;box-sizing:border-box;width:36px;height:36px;padding:0;gap:0}
`;

		/**
		 * Gear glyph copied verbatim from the official `IconSettingsOutlineMedium` primitive
		 * (16px grid, 1.3 stroke). Copied instead of required: a plugin must not load a Harness
		 * Client package as a module, and copying keeps the exact host shape.
		 */
		function GearGlyph({ size = ICON_SIZE }) {
			return h("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				strokeWidth: 1.3,
				"aria-hidden": "true",
				focusable: "false"
			}, h("path", {
				d: "M8 9.75012C8.9665 9.75012 9.75 8.96662 9.75 8.00012C9.75 7.03362 8.9665 6.25012 8 6.25012C7.0335 6.25012 6.25 7.03362 6.25 8.00012C6.25 8.96662 7.0335 9.75012 8 9.75012Z",
				stroke: "currentColor"
			}), h("path", {
				d: "M13.0107 7.79377C12.9505 7.89401 12.9205 7.94413 12.9205 7.99951C12.9205 8.0549 12.9505 8.10502 13.0106 8.20528L13.9849 9.83006C14.045 9.93029 14.0751 9.9804 14.0751 10.0358C14.0751 10.0911 14.045 10.1413 13.9849 10.2415L13.0037 11.8777C12.9468 11.9726 12.9184 12.0201 12.8725 12.0461C12.8267 12.072 12.7713 12.072 12.6607 12.072H10.6704C10.5598 12.072 10.5045 12.072 10.4586 12.098C10.4128 12.1239 10.3843 12.1714 10.3274 12.2662L9.33825 13.9142C9.28133 14.009 9.25287 14.0564 9.20703 14.0823C9.16118 14.1083 9.10588 14.1083 8.99529 14.1083H7.00486C6.89426 14.1083 6.83896 14.1083 6.79312 14.0823C6.74727 14.0564 6.71881 14.009 6.6619 13.9142L5.67273 12.2662C5.61581 12.1714 5.58735 12.1239 5.54151 12.098C5.49566 12.072 5.44036 12.072 5.32977 12.072H3.33945C3.2288 12.072 3.17347 12.072 3.12761 12.0461C3.08176 12.0201 3.0533 11.9726 2.9964 11.8777L2.0152 10.2415C1.9551 10.1413 1.92505 10.0911 1.92505 10.0358C1.92505 9.9804 1.9551 9.93029 2.0152 9.83006L2.98951 8.20528C3.04963 8.10502 3.07969 8.0549 3.07969 7.99951C3.07968 7.94413 3.04961 7.89401 2.98946 7.79377L2.01529 6.17011C1.95514 6.06987 1.92507 6.01975 1.92507 5.96437C1.92506 5.90899 1.95512 5.85886 2.01524 5.7586L2.9964 4.1224C3.0533 4.0275 3.08176 3.98005 3.12761 3.95408C3.17347 3.92811 3.2288 3.92811 3.33945 3.92811H5.32977C5.44036 3.92811 5.49566 3.92811 5.54151 3.90216C5.58735 3.87621 5.61581 3.82879 5.67273 3.73397L6.6619 2.08599C6.71881 1.99116 6.74727 1.94375 6.79312 1.9178C6.83896 1.89185 6.89426 1.89185 7.00486 1.89185H8.99529C9.10588 1.89185 9.16118 1.89185 9.20703 1.9178C9.25287 1.94375 9.28133 1.99116 9.33825 2.08599L10.3274 3.73397C10.3843 3.82879 10.4128 3.87621 10.4586 3.90216C10.5045 3.92811 10.5598 3.92811 10.6704 3.92811H12.6607C12.7713 3.92811 12.8267 3.92811 12.8725 3.95408C12.9184 3.98005 12.9468 4.0275 13.0037 4.1224L13.9849 5.7586C14.045 5.85886 14.0751 5.90899 14.0751 5.96437C14.0751 6.01975 14.045 6.06987 13.9849 6.17011L13.0107 7.79377Z",
				stroke: "currentColor"
			}));
		}

		/** Last-resort path when the shortcuts service is unavailable: synthesize Ctrl+, */
		function pressSettingsShortcut() {
			try {
				const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
				target.dispatchEvent(new KeyboardEvent("keydown", {
					key: ",",
					code: "Comma",
					keyCode: 188,
					ctrlKey: true,
					bubbles: true,
					cancelable: true,
					composed: true
				}));
			} catch (error) {
				console.error("[dsh-settings-companion] fallback shortcut failed", error);
			}
		}

		/**
		 * Opens settings through the shortcut registry — the same path a menu item takes, so no
		 * synthetic key event is needed. `modal: null` matters: `settings.open` treats a non-null
		 * modal as "toggle", while we always want "open". Falls back to the key event when the
		 * registry is missing, and ignores click bursts so a double-click cannot toggle it shut.
		 */
		function createOpenSettings(ctx) {
			let lastClickAt = 0;
			return (event) => {
				const now = typeof performance === "object" ? performance.now() : Date.now();
				if (now - lastClickAt < CLICK_GUARD_MS) return;
				lastClickAt = now;
				const target = event?.currentTarget instanceof Element ? event.currentTarget : document.activeElement;
				const registry = ctx.get("shortcuts")?.registry;
				if (registry !== void 0 && typeof registry.invoke === "function") {
					try {
						registry.invoke("settings.open", {
							target,
							region: "page",
							modal: null
						});
						return;
					} catch (error) {
						console.error("[dsh-settings-companion] settings.open failed", error);
					}
				}
				pressSettingsShortcut();
			};
		}

		/** Snapshot of the native account row: its node plus the official classes/state we mirror. */
		function readNativeRow() {
			const launcher = document.querySelector(LAUNCHER);
			const trigger = launcher?.querySelector("button") ?? null;
			let triggerClass = "";
			let labelClass = "";
			if (trigger !== null) {
				for (const name of trigger.classList) {
					if (name.endsWith("_trigger")) {
						triggerClass = name;
						break;
					}
				}
				if (triggerClass === "") {
					triggerClass = Array.from(trigger.classList).find((name) => name !== COLUMN_CLASS) ?? "";
				}
				for (const span of trigger.querySelectorAll("span[class]")) {
					for (const name of span.classList) {
						if (name.endsWith("_label")) {
							labelClass = name;
							break;
						}
					}
					if (labelClass !== "") break;
				}
			}
			return {
				row: launcher?.parentElement ?? null,
				triggerClass,
				labelClass,
				signedOut: trigger?.getAttribute("data-signed-out") ?? null
			};
		}

		function sameRow(a, b) {
			return a.row === b.row && a.triggerClass === b.triggerClass && a.labelClass === b.labelClass && a.signedOut === b.signedOut;
		}

		/**
		 * Tracks the account row. A MutationObserver on the row reacts immediately to login,
		 * logout and sidebar collapse; the slow poll only covers the row mounting later and is
		 * skipped while the window is hidden.
		 */
		function useNativeRow() {
			const [native, setNative] = react.useState(readNativeRow);
			react.useEffect(() => {
				let active = true;
				let observer = null;
				let observed = null;
				const commit = (next) => {
					if (active) setNative((previous) => (sameRow(previous, next) ? previous : next));
				};
				const watch = (row) => {
					if (row === observed) return;
					observer?.disconnect();
					observer = null;
					observed = row;
					if (row === null) return;
					observer = new MutationObserver(() => {
						if (active) commit(readNativeRow());
					});
					observer.observe(row, {
						attributes: true,
						attributeFilter: ["class", "data-signed-out"],
						childList: true,
						subtree: true
					});
				};
				const scan = () => {
					if (!active) return;
					const next = readNativeRow();
					commit(next);
					watch(next.row);
				};
				scan();
				const timer = window.setInterval(() => {
					if (document.hidden === true) return;
					scan();
				}, POLL_MS);
				return () => {
					active = false;
					observer?.disconnect();
					window.clearInterval(timer);
				};
			}, []);
			return native;
		}

		/**
		 * The right half of the row: "gear + 设置", portalled into the account row next to the
		 * official menu. Its stylesheet renders with the component, so unmounting takes it away.
		 */
		function SettingsColumn(props) {
			const wide = props?.wide !== false;
			const openSettings = typeof props?.openSettings === "function" ? props.openSettings : () => {};
			const label = typeof props?.t === "function" ? props.t("label") : "设置";
			const native = useNativeRow();
			if (native.row === null || native.row.isConnected !== true) return null;
			const className = native.triggerClass === "" ? COLUMN_CLASS : `${native.triggerClass} ${COLUMN_CLASS}`;
			return reactDom.createPortal(h(react.Fragment, null, h("style", {
				id: STYLE_ID
			}, CSS), h("button", {
				type: "button",
				className,
				"data-dsh-settings-companion": "",
				"data-collapsed": wide ? "false" : "true",
				"data-signed-out": native.signedOut ?? void 0,
				title: label,
				"aria-label": label,
				"aria-keyshortcuts": "Control+,",
				onClick: openSettings
			}, h(GearGlyph, {
				size: ICON_SIZE
			}), wide ? h("span", {
				className: native.labelClass === "" ? void 0 : native.labelClass
			}, label) : null)), native.row);
		}

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				en: {
					label: "Settings"
				},
				zh: {
					label: "设置"
				}
			}), "settings-companion: dictionary");

			const slots = ctx.get("slots");
			if (slots === null || slots === void 0) return;
			const openSettings = createOpenSettings(ctx);
			slots.inject(SLOT, () => slots.register({
				name: SLOT,
				id: "settings-companion",
				order: -100,
				locale: NS,
				inject: () => ({ openSettings })
			}, SettingsColumn));
		}

		return {
			inject: ["slots", "locale"],
			apply
		};
	}
});
