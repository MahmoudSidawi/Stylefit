type IconName =
  | 'sparkles'
  | 'search'
  | 'bag'
  | 'heart'
  | 'arrow'
  | 'close'
  | 'menu'
  | 'sliders'
  | 'wardrobe'
  | 'eye'
  | 'ruler'
  | 'check'
  | 'plus'
  | 'reset'
  | 'bookmark'
  | 'hanger'
  | 'swap'
  | 'info'
  | 'camera'
  | 'upload'
  | 'edit'
  | 'trash'
  | 'lock'

const paths: Record<IconName, string> = {
  sparkles:
    'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4m-2-2h4',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  bag: 'M5 7h14l1 14H4L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  sliders: 'M4 4v5m0 4v7M12 4v10m0 4v2M20 4v2m0 4v10M1 9h6m2 9h6m2-12h6',
  wardrobe: 'M5 3h14v17H5V3Zm7 0v17M5 15h14M9 8v3m6-3v3M7 20v2m10-2v2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  ruler: 'M3 6h18v12H3V6Zm4 0v5m4-5v3m4-3v5m4-5v3',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  hanger: 'M10 5a2 2 0 1 1 3 1.7L12 8v2L2 17v2h20v-2l-10-7',
  swap: 'M3 7h17l-4-4M21 17H4l4 4M20 7l-4 4M4 17l4-4',
  info: 'M12 10v7m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  camera: 'M3 6h4l2-3h6l2 3h4v15H3V6Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  upload: 'M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 4v3',
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
