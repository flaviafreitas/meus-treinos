import Skeleton from 'react-loading-skeleton'

export default function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton width={76} height={76} borderRadius={16} />
      <div className="card__info">
        <Skeleton height={18} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
    </div>
  )
}
