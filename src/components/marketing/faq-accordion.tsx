import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <Accordion className="mx-auto max-w-2xl">
      {items.map((item, i) => (
        <AccordionItem key={item.question} value={String(i)}>
          <AccordionTrigger className="font-display text-base font-medium text-brand-navy">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
