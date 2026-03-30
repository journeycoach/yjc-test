/* global window */
import { useEffect } from 'react'

export function ReturnToSite() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }, [])
  
  return null
}
