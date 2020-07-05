import Foundation

final class ApertureNotification {
  private var notification: Notification
  var isAnswered = false

  init(_ notification: Notification) {
    self.notification = notification
  }

  func getField<T>(_ name: String) -> T? {
    return notification.userInfo?[name] as? T
  }

  func getData() -> String? {
    return getField("data")
  }

  func answer() {
    answer(nil)
  }

  func answer(_ data: Any?) {
    isAnswered = true

    let responseName: String? = getField("responseName")

    guard responseName != nil else {
      return
    }

    var payload = [AnyHashable: Any]()

    if data != nil {
      payload["data"] = "\(data!)"
    }

    DistributedNotificationCenter.default().postNotificationName(
      .Name(responseName!),
      object: nil,
      userInfo: payload,
      deliverImmediately: true
    )
  }
}

func answerEvent(
  processId: String,
  event: String,
  using handler: @escaping (ApertureNotification) -> Void
) -> NSObjectProtocol {
  return DistributedNotificationCenter.default().addObserver(
    forName: .Name("aperture.\(processId).\(event)"),
    object: nil,
    queue: nil
  ) { notification in
    let apertureNotification = ApertureNotification(notification)
    handler(apertureNotification)

    if !apertureNotification.isAnswered {
      apertureNotification.answer()
    }
  }
}

func sendEvent(
  processId: String,
  event: String,
  data: Any?,
  using callback: @escaping (ApertureNotification) -> Void
) {
  let responseName = "aperture.\(processId).\(event).response.\(UUID().uuidString)"

  var payload: [AnyHashable: Any] = ["responseName": responseName]

  if data != nil {
    payload["data"] = "\(data!)"
  }

  var observer: Any?

  observer = DistributedNotificationCenter.default().addObserver(
    forName: .Name(responseName),
    object: nil,
    queue: nil
  ) { notification in
    DistributedNotificationCenter.default().removeObserver(observer!)
    callback(ApertureNotification(notification))
  }

  DistributedNotificationCenter.default().postNotificationName(
    .Name("aperture.\(processId).\(event)"),
    object: nil,
    userInfo: payload,
    deliverImmediately: true
  )
}

func sendEvent(processId: String, event: String, using callback: @escaping (ApertureNotification) -> Void) {
  sendEvent(processId: processId, event: event, data: nil, using: callback)
}

func sendEvent(processId: String, event: String) {
  sendEvent(processId: processId, event: event, data: nil) { _ in }
}

func sendEvent(processId: String, event: String, data: Any?) {
  sendEvent(processId: processId, event: event, data: data) { _ in }
}
