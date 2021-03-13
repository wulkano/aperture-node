import Foundation

final class ApertureNotification {
  static func notificationName(forEvent event: String, processId: String) -> String {
    "aperture.\(processId).\(event)"
  }

  private var notification: Notification
  var isAnswered = false

  init(_ notification: Notification) {
    self.notification = notification
  }

  func getField<T>(_ name: String) -> T? {
    notification.userInfo?[name] as? T
  }

  var data: String? { getField("data") }

  func answer(_ data: Any? = nil) {
    isAnswered = true

    guard
	  let responseIdentifier: String = getField("responseIdentifier")
	else {
      return
    }

    var payload = [AnyHashable: Any]()

    if let payloadData = data {
      payload["data"] = "\(payloadData)"
    }

    DistributedNotificationCenter.default().postNotificationName(
      .init(responseIdentifier),
      object: nil,
      userInfo: payload,
      deliverImmediately: true
    )
  }
}

enum ApertureEvents {
  static func answerEvent(
    processId: String,
    event: String,
    using handler: @escaping (ApertureNotification) -> Void
  ) -> NSObjectProtocol {
	DistributedNotificationCenter.default().addObserver(
      forName: .init(ApertureNotification.notificationName(forEvent: event, processId: processId)),
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

  static func sendEvent(
    processId: String,
    event: String,
    data: Any?,
    using callback: @escaping (ApertureNotification) -> Void
  ) {
    let notificationName = ApertureNotification.notificationName(forEvent: event, processId: processId)
    let responseIdentifier = "\(notificationName).response.\(UUID().uuidString)"

    var payload: [AnyHashable: Any] = ["responseIdentifier": responseIdentifier]

    if let payloadData = data {
      payload["data"] = "\(payloadData)"
    }

    var observer: AnyObject?

    observer = DistributedNotificationCenter.default().addObserver(
      forName: .init(responseIdentifier),
      object: nil,
      queue: nil
    ) { notification in
      DistributedNotificationCenter.default().removeObserver(observer!)
      callback(ApertureNotification(notification))
    }

    DistributedNotificationCenter.default().postNotificationName(
      .init(
        ApertureNotification.notificationName(forEvent: event, processId: processId)
      ),
      object: nil,
      userInfo: payload,
      deliverImmediately: true
    )
  }

  static func sendEvent(
    processId: String,
    event: String,
    using callback: @escaping (ApertureNotification) -> Void
  ) {
    sendEvent(
        processId: processId,
        event: event,
        data: nil,
        using: callback
    )
  }

  static func sendEvent(
    processId: String,
    event: String,
    data: Any? = nil
  ) {
    sendEvent(
        processId: processId,
        event: event,
        data: data
    ) { _ in }
  }
}
