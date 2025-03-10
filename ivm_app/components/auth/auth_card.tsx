"use client";

import React from 'react'
import Link from "next/link";
import Image from "next/image";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter
} from "../ui/card";

interface AuthCardProps {
  children: React.ReactNode;
  cardLabel: string;
  exitLabel: string;
  exitHref: string;
};

const AuthCard: React.FC<AuthCardProps> = ({ children, cardLabel, exitLabel, exitHref }) => {
  return (
    <Card className="w-[400px] shadow-md">
      <CardHeader>
        <div className="w-full flex flex-col gap-y-4 items-center justify-center">
          <h1 className={"text-3xl font-semibold"}>
            <Image src="/IVM Logo Design_Black_24 0225_t.png"
              alt="IVM Logo"
              width="128" height="128"
              priority
            />
          </h1>
          <p className="text-muted-foreground text-sm">
            {cardLabel}
          </p>

        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter>
        <Button
          variant="link"
          className="font-normal w-full"
          size="sm"
          asChild
        >
          <Link href={exitHref}>
            {exitLabel}
          </Link>
        </Button>
      </CardFooter>
    </Card>)
}

export default AuthCard