"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={toggleTheme}
      className="h-6 cursor-pointer bg-card border-foreground hover:bg-card/80 hover:translate-0.5"
      data-icon="inline-start"
    >
      <Sun className="h-4 w-4 text-foreground block dark:hidden" />
      
      <Moon className="h-4 w-4 text-foreground hidden dark:block" />
      
      <span className="text-xs font-heading sm:text-sm uppercase text-nowrap text-foreground block dark:hidden">
        Day
      </span>
      <span className="text-xs font-heading sm:text-sm uppercase text-nowrap text-foreground hidden dark:block">
        Night
      </span>
    </Button>
  )
}


  

