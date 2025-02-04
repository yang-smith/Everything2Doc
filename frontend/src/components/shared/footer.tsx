import { Github, Twitter } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background/50 backdrop-blur-sm">
      <div className="container flex items-center justify-between py-1">
        <div className="text-sm text-muted-foreground/50">
          © {new Date().getFullYear()} Everything2Doc
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="https://github.com/yourusername/everything2doc" 
            target="_blank"
            className="text-muted-foreground/50 hover:text-muted-foreground/75 transition-colors"
          >
            <Github className="h-4 w-4" />
          </Link>
          <Link 
            href="https://twitter.com/yourusername" 
            target="_blank"
            className="text-muted-foreground/50 hover:text-muted-foreground/75 transition-colors"
          >
            <Twitter className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  )
}