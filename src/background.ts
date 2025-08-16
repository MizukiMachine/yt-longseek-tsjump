chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      console.log('Sending to tab:', tabs[0].id, { action: command })
      chrome.tabs.sendMessage(tabs[0].id, { action: command })
    }
  })
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    seekMinutes: {
      short: 10,
      medium: 30,
      long: 60
    },
    autoYesterday: true
  })
})