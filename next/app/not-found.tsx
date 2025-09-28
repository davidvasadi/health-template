// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16 text-center">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Az oldal nem található</h1>
        <p className="mt-2 text-neutral-600">
          A keresett oldal nem elérhető vagy átkerült.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </main>
  );
}
