"use client";

/**
 * \n * =============================== MODAL KOMPONENS CSOMAG ===============================
 * CÉL:
 *   - Újrafelhasználható, context-alapú, Framer Motion-nel animált modál ablak React + TS környezethez.
 *   - A komponensek együtt egy komplett modálrendszert adnak: trigger, test (body), tartalom és lábléc.
 *
 * FŐ FUNKCIÓK:
 *   - Globális "open" állapot Contextben; bárhol a fán elérhető a useModal hookkal.
 *   - Test görgetés letiltása nyitáskor (body overflow kezelése), visszaengedése záráskor.
 *   - Kívülre kattintásra zárás (useOutsideClick hook).
 *   - Háttér (overlay) és doboz animációk (belépés/kilépés) Framer Motion-nel, blur effekt.
 *   - Tailwind osztályokkal könnyen átstilizálható felépítés.
 *
 * EXPORTOK:
 *   ModalProvider, useModal, Modal, ModalTrigger, ModalBody, ModalContent, ModalFooter, useOutsideClick
 *
 * HASZNÁLAT (példa):
 *   <Modal>
 *     <ModalTrigger>Megnyitás</ModalTrigger>
 *     <ModalBody>
 *       <ModalContent>Ide jön a tartalom</ModalContent>
 *       <ModalFooter>
 *         <button>Ok</button>
 *       </ModalFooter>
 *     </ModalBody>
 *   </Modal>
 *
 * MEGJEGYZÉSEK / TIPPEK:
 *   - A11y: érdemes a modál dobozra felvenni role="dialog" és aria-modal="true" attribútumokat,
 *           valamint fókusz-csapdát és ESC zárást (itt TODO-ként jelölve a kommentekben).
 *   - Body overflow: egyszerű megoldás, ha a kiinduló érték nem "auto", érdemes eltárolni és visszaállítani.
 *   - Típusosság: a useOutsideClick eseményét lehetne szigorúbban típusozni (MouseEvent | TouchEvent).
 * ======================================================================================
 */

import { cn } from "@/lib/utils"; // Tailwind-hez hasznos segédfüggvény osztálynevek összevonására
import { AnimatePresence, motion } from "framer-motion"; // Belépő/kilépő animációk + animálható elemek
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../elements/button"; // Projekt-specifikus gomb komponens

/**
 * A modál állapotát leíró Context típus.
 * - open: meg van-e nyitva a modál
 * - setOpen: nyitás/zárás állapotváltó függvény
 */
interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// A Context, amely a modál globális állapotát osztja meg a gyermek komponensekkel.
const ModalContext = createContext<ModalContextType | undefined>(undefined);

/**
 * Provider, amely a modál nyitottságát egy useState-ben kezeli,
 * és elérhetővé teszi a Contexten keresztül a gyermekek számára.
 */
export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false); // Alapértelmezetten zárt modál

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

/**
 * Hook a Context kényelmes használatához.
 * Ha nincs ModalProvider a komponensfa felett, hiba dobódik (guard).
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

/**
 * Kényelmi komponens: a kapott gyermekeket egy ModalProvider-be csomagolja,
 * így egyszerűen használható önálló modál-szigetként.
 */
export function Modal({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

/**
 * Gomb/trigger a modál megnyitásához.
 * - Kattintáskor open=true, majd opcionálisan meghívja a kapott onClick-et is.
 */
export const ModalTrigger = ({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  const { setOpen } = useModal();
  return (
    <Button
      onClick={() => {
        setOpen(true); // Nyitás
        onClick?.(); // Kiegészítő kattintási logika, ha adtunk
      }}
      className={className}
    >
      {children}
    </Button>
  );
};

/**
 * A modál "teste":
 * - Figyeli az open állapotot és tiltja/engedélyezi a body görgetést.
 * - Kívülre kattintásra zár.
 * - Overlay + doboz animációk AnimatePresence-szel és motion.div-vel.
 */
export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { open } = useModal();

  // Test (document.body) görgetés kezelése a modál nyitottsága alapján.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"; // Nyitva: görgetés tiltása
    } else {
      document.body.style.overflow = "auto"; // Zárva: visszaengedés
    }
  }, [open]);

  const modalRef = useRef<HTMLDivElement | null>(null); // A modál doboz referenciája
  const { setOpen } = useModal();

  // Kívülre kattintás esetén zárjuk a modált
  useOutsideClick(modalRef, () => setOpen(false));

  // TODO (A11y): ESC billentyű lenyomására is zárjuk a modált; fókusz csapda kialakítása

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Teljes képernyős konténer, amely tartalmazza az overlayt és a dobozt
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
            backdropFilter: "blur(10px)", // Háttér életlenítés
          }}
          exit={{
            opacity: 0,
            backdropFilter: "blur(0px)",
          }}
          className="fixed [perspective:800px] [transform-style:preserve-3d] inset-0 h-full w-full  flex items-center justify-center z-50"
        >
          {/* Sötét, áttetsző háttér réteg */}
          <Overlay />

          {/* A modál doboza (kártya) */}
          <motion.div
            ref={modalRef}
            className={cn(
              "min-h-[50%] max-h-[90%] md:max-w-[40%] bg-white  border border-transparent md:rounded-2xl relative z-50 flex flex-col flex-1 overflow-hidden",
              className
            )}
            // Belépő animáció (kicsiből nagyobbra, enyhe 3D billenéssel)
            initial={{
              opacity: 0,
              scale: 0.5,
              rotateX: 40,
              y: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotateX: 10,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 35,
            }}
            // TODO (A11y): role="dialog" aria-modal="true" aria-labelledby/aria-describedby hozzárendelése
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Tartalmi konténer a modál belsejéhez (paddel ellátva),
 * ide érdemes a tényleges szöveget/űrlapot stb. tenni.
 */
export const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col flex-1 p-8 md:p-10", className)}>
      {children}
    </div>
  );
};

/**
 * Lábléc a modálhoz (pl. gombok helye). Alapból jobbra igazítva, világos háttérrel.
 */
export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex justify-end p-4 bg-gray-100 ", className)}>
      {children}
    </div>
  );
};

/**
 * Háttér (overlay) komponens: elsötétíti a hátteret és animált blur-t ad.
 * Teljes képernyőt lefedi, a modál doboz alatt helyezkedik el.
 */
const Overlay = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        backdropFilter: "blur(10px)",
      }}
      exit={{
        opacity: 0,
        backdropFilter: "blur(0px)",
      }}
      className={`fixed inset-0 h-full w-full bg-black bg-opacity-50 z-50 ${className}`}
    ></motion.div>
  );
};

/**
 * Jobb felső sarokban elhelyezett X ikon gomb, amely bezárja a modált.
 */
const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(false)} // Zárás kattintásra
      className="absolute top-4 right-4 group"
      // TODO (A11y): aria-label="Bezárás" hozzáadása képernyőolvasókhoz
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-black  h-4 w-4 group-hover:scale-125 group-hover:rotate-3 transition duration-200"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};

// ============================================================================
// HOOK: kívülre kattintás figyelése
// ============================================================================

/**
 * useOutsideClick
 * - Figyeli a mousedown és touchstart eseményeket.
 * - Ha a kattintás/tap a megadott ref-en kívül történik, meghívja a callback-et.
 *
 * @param ref   A figyelt elem referenciája (tipikusan a modál doboz)
 * @param callback  Függvény, amelyet akkor hívunk, ha kívülre kattintottunk
 */
export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement>,
  callback: Function
) => {
  useEffect(() => {
    const listener = (event: any) => {
      // MEGJEGYZÉS: az event itt "any"; szigorúbb típus: MouseEvent | TouchEvent

      // NINCS TEENDŐ, ha a célpont a ref aktuális eleme vagy annak gyermeke
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      // Egyébként hívjuk a callback-et (pl. modál zárása)
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
