import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Choice = {
	id: string;
	isSelected: boolean;
	label: string;
};

type LinkChoice = Choice & {
	linkProps: Omit<ComponentPropsWithoutRef<"a">, "aria-current" | "children" | "className"> & {
		href: string;
	};
};

type ButtonChoice = Choice & {
	buttonProps?: Omit<
		ComponentPropsWithoutRef<"button">,
		"aria-label" | "aria-pressed" | "children" | "className" | "type"
	> &
		Partial<Record<`data-${string}`, string>>;
	icon?: ReactNode;
};

type LinkChoiceSwitcherProps = {
	action: "link";
	choices: readonly LinkChoice[];
};

type ButtonChoiceSwitcherProps = {
	action: "button";
	choices: readonly ButtonChoice[];
};

type ChoiceSwitcherProps = LinkChoiceSwitcherProps | ButtonChoiceSwitcherProps;

function ChoiceList<T extends Choice>({
	choices,
	renderChoice,
}: {
	choices: readonly T[];
	renderChoice: (choice: T) => ReactNode;
}) {
	return (
		<ul className="flex items-center text-xs">
			{choices.map((choice, index) => (
				<li className="flex items-center" key={choice.id}>
					{renderChoice(choice)}

					{index < choices.length - 1 ? (
						<span aria-hidden="true">&nbsp;·&nbsp;</span>
					) : null}
				</li>
			))}
		</ul>
	);
}

export function ChoiceSwitcher(props: ChoiceSwitcherProps) {
	if (props.action === "link") {
		return (
			<ChoiceList
				choices={props.choices}
				renderChoice={({ isSelected, label, linkProps }) => (
					<a
						{...linkProps}
						aria-current={isSelected ? "page" : undefined}
						className={[
							"rounded-sm px-1 py-0.5",
							isSelected
								? "bg-(--foreground-color) font-medium text-(--background-color)! no-underline"
								: "hover:bg-(--inactive-hover-color)",
						].join(" ")}
					>
						{label}
					</a>
				)}
			/>
		);
	}

	return (
		<ChoiceList
			choices={props.choices}
			renderChoice={({ buttonProps, icon, isSelected, label }) => (
				<button
					{...buttonProps}
					aria-label={label}
					aria-pressed={isSelected}
					className={[
						"appearance-none cursor-pointer rounded-sm px-1 py-0.5",
						"aria-pressed:bg-(--foreground-color) aria-pressed:font-medium aria-pressed:text-(--background-color) aria-[pressed=false]:hover:bg-(--inactive-hover-color)",
						"focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-solid focus-visible:-outline-offset-2",
					].join(" ")}
					type="button"
				>
					{icon ? <span className="sm:hidden">{icon}</span> : null}
					<span className={icon ? "hidden sm:inline" : undefined}>{label}</span>
				</button>
			)}
		/>
	);
}
