import { Search, Bell } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-6 border-b border-resolve-border bg-resolve-surface px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="flex flex-1" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        Search incidents, patterns, services...
                    </label>
                    <div className="relative w-full max-w-lg flex items-center">
                        <Search
                            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-resolve-text-muted"
                            aria-hidden="true"
                        />
                        <input
                            id="search-field"
                            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-resolve-text-primary focus:ring-0 sm:text-sm placeholder:text-resolve-text-muted"
                            placeholder="Search incidents, patterns, services..."
                            type="search"
                            name="search"
                        />
                    </div>
                </form>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-resolve-text-muted hover:text-resolve-text-primary">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
}
