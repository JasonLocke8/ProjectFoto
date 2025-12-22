export type Photo = {
  id: string
  src: string
  alt: string
  caption?: string
  takenAt?: string
  location?: string
}

export type Album = {
  slug: string
  title: string
  subtitle?: string
  coverSrc: string
  photos: Photo[]
}

export const albums: Album[] = [
  {
    slug: 'italia',
    title: 'Italia',
    subtitle: 'Viaje con Tami por Roma, Florencia y la Costa Amalfitana.',
    coverSrc: 'https://picsum.photos/id/1011/1400/900',
    photos: [
      {
        id: '1015',
        src: 'https://picsum.photos/id/1015/1200/1200',
        alt: 'Italia 1015',
        takenAt: '2024-06-12',
        location: 'Roma',
      },
      {
        id: '1016',
        src: 'https://picsum.photos/id/1016/1200/1200',
        alt: 'Italia 1016',
        takenAt: '2024-06-13',
        location: 'Roma',
      },
      {
        id: '1020',
        src: 'https://picsum.photos/id/1020/1200/1200',
        alt: 'Italia 1020',
        takenAt: '2024-06-14',
        location: 'Florencia',
      },
      {
        id: '1024',
        src: 'https://picsum.photos/id/1024/1200/1200',
        alt: 'Italia 1024',
        takenAt: '2024-06-15',
        location: 'Costa Amalfitana',
      },
      {
        id: '1031',
        src: 'https://picsum.photos/id/1031/1200/1200',
        alt: 'Italia 1031',
        takenAt: '2024-06-16',
        location: 'Nápoles',
      },
      {
        id: '1033',
        src: 'https://picsum.photos/id/1033/1200/1200',
        alt: 'Italia 1033',
        takenAt: '2024-06-17',
        location: 'Positano',
      },
    ],
  },
  {
    slug: 'galeria-general',
    title: 'Galería General',
    subtitle: 'Fotos variadas de mi vida.',
    coverSrc: 'https://picsum.photos/id/1040/1400/900',
    photos: [
      {
        id: '1027',
        src: 'https://picsum.photos/id/1027/1200/1200',
        alt: 'General 1027',
        takenAt: '2024-01-04',
      },
      {
        id: '1035',
        src: 'https://picsum.photos/id/1035/1200/1200',
        alt: 'General 1035',
        takenAt: '2024-02-10',
      },
      {
        id: '1043',
        src: 'https://picsum.photos/id/1043/1200/1200',
        alt: 'General 1043',
        takenAt: '2024-03-08',
      },
      {
        id: '1050',
        src: 'https://picsum.photos/id/1050/1200/1200',
        alt: 'General 1050',
        takenAt: '2024-03-22',
      },
      {
        id: '1060',
        src: 'https://picsum.photos/id/1060/1200/1200',
        alt: 'General 1060',
        takenAt: '2024-04-01',
      },
      {
        id: '1069',
        src: 'https://picsum.photos/id/1069/1200/1200',
        alt: 'General 1069',
        takenAt: '2024-04-19',
      },
      {
        id: '1074',
        src: 'https://picsum.photos/id/1074/1200/1200',
        alt: 'General 1074',
        takenAt: '2024-05-07',
      },
      {
        id: '1084',
        src: 'https://picsum.photos/id/1084/1200/1200',
        alt: 'General 1084',
        takenAt: '2024-05-28',
      },
      {
        id: '1080',
        src: 'https://picsum.photos/id/1080/1200/1200',
        alt: 'General 1080',
        takenAt: '2024-06-02',
      },
      {
        id: '1081',
        src: 'https://picsum.photos/id/1081/1200/1200',
        alt: 'General 1081',
        takenAt: '2024-06-08',
      },
      {
        id: '1082',
        src: 'https://picsum.photos/id/1082/1200/1200',
        alt: 'General 1082',
        takenAt: '2024-06-19',
      },
    ],
  },
]

export function getAlbumBySlug(slug: string) {
  return albums.find((a) => a.slug === slug)
}
