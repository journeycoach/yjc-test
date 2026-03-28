import { useEffect } from 'react'

export function ReturnToSite() {
  useEffect(() => {
    window.location.href = '/'
  }, [])
  
  return null
}
