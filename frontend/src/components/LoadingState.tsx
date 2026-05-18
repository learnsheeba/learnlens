interface LoadingStateProps {
  message: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <section className="loading">
      <div className="progress">
        <div className="progress-bar" />
      </div>
      <div className="loading-msg">{message}</div>
      <div className="skel-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skel" key={i} />
        ))}
      </div>
    </section>
  )
}
