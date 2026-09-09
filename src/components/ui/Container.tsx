import type { PropsWithChildren } from "react";

export function Container({ children }: Readonly<PropsWithChildren>) {
	return <div className="mx-auto w-full max-w-2xl px-6 sm:px-8">{children}</div>;
}
