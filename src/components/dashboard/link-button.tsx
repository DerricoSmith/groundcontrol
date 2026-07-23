import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export function LinkButton({
  href,
  children,
  className,
  variant,
  size,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}
