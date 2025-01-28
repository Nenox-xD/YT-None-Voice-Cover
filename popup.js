document.addEventListener('DOMContentLoaded', async () => {
  const languageList = document.getElementById('language-list');
  const videoTitle = document.getElementById('video-title');
  const autoOriginalCheckbox = document.getElementById('auto-original');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Benutzer-Einstellung abrufen
  chrome.storage.local.get("autoOriginal", (data) => {
      autoOriginalCheckbox.checked = data.autoOriginal || false;
  });

  autoOriginalCheckbox.addEventListener("change", () => {
      chrome.storage.local.set({ autoOriginal: autoOriginalCheckbox.checked });
  });

  if (tab && tab.url.includes('youtube.com/watch')) {
      // 📌 Titel des Videos abrufen
      chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
              const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata');
              return titleElement ? titleElement.innerText.trim() : 'Kein Titel gefunden';
          }
      }, (results) => {
          if (results && results[0] && results[0].result) {
              videoTitle.textContent = results[0].result;
          } else {
              videoTitle.textContent = 'Kein Titel gefunden';
          }
      });

      // 📌 Audio-Sprachen abrufen
      chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async () => {
              function waitForElement(selector, timeout = 3000) {
                  return new Promise((resolve, reject) => {
                      const interval = setInterval(() => {
                          const element = document.querySelector(selector);
                          if (element) {
                              clearInterval(interval);
                              resolve(element);
                          }
                      }, 200);

                      setTimeout(() => {
                          clearInterval(interval);
                          reject(`Timeout: Element ${selector} nicht gefunden`);
                      }, timeout);
                  });
              }

              try {
                  const settingsButton = document.querySelector('.ytp-settings-button');
                  if (!settingsButton) return [];

                  settingsButton.click();
                  await waitForElement('.ytp-menuitem', 2000);

                  const menuItems = Array.from(document.querySelectorAll('.ytp-menuitem'));
                  const audioMenuItem = menuItems.find(item => item.textContent.includes('Audiotrack') || item.textContent.includes('Audio'));

                  if (audioMenuItem) {
                      audioMenuItem.click();
                      await waitForElement('.ytp-menuitem', 2000);

                      // 🎯 Filtere nur die Audiotracks
                      const languageOptions = Array.from(document.querySelectorAll('.ytp-menuitem'))
                          .map(option => option.textContent.trim())
                          .filter(text => text.match(/^[A-Za-zÄÖÜäöüß\s\(\)]+$/) && !text.includes("Automatisch") && !text.includes("Untertitel") && !text.includes("Qualität")); 

                      return languageOptions;
                  }
                  return [];
              } catch (error) {
                  console.error(error);
                  return [];
              }
          }
      }, (results) => {
          if (results && results[0] && results[0].result.length > 0) {
              languageList.innerHTML = ''; 
              results[0].result.forEach(language => {
                  const li = document.createElement('li');
                  li.textContent = language;
                  li.addEventListener('click', () => setLanguage(language));
                  languageList.appendChild(li);
              });

              // Wenn Auto-Originalsprache aktiv ist, NACHDEM die Sprachen geladen wurden, setzen
              chrome.storage.local.get("autoOriginal", (data) => {
                  if (data.autoOriginal && results[0].result.includes("Originalsprache")) {
                      setLanguage("Originalsprache");
                  }
              });
          } else {
              languageList.innerHTML = '<li>Keine Sprachen gefunden</li>';
          }
      });

  } else {
      videoTitle.textContent = 'Nicht auf einer YouTube-Video-Seite';
      languageList.innerHTML = '<li>Bitte öffne ein YouTube-Video</li>';
  }
});

// 📌 Sprache setzen
function setLanguage(language) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab && tab.url.includes('youtube.com/watch')) {
          chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: async (selectedLanguage) => {
                  function waitForElement(selector, timeout = 3000) {
                      return new Promise((resolve, reject) => {
                          const interval = setInterval(() => {
                              const element = document.querySelector(selector);
                              if (element) {
                                  clearInterval(interval);
                                  resolve(element);
                              }
                          }, 200);

                          setTimeout(() => {
                              clearInterval(interval);
                              reject(`Timeout: Element ${selector} nicht gefunden`);
                          }, timeout);
                      });
                  }

                  try {
                      const settingsButton = document.querySelector('.ytp-settings-button');
                      if (!settingsButton) return;

                      settingsButton.click();
                      await waitForElement('.ytp-menuitem', 2000);

                      const menuItems = Array.from(document.querySelectorAll('.ytp-menuitem'));
                      const audioMenuItem = menuItems.find(item => item.textContent.includes('Audiotrack') || item.textContent.includes('Audio'));

                      if (audioMenuItem) {
                          audioMenuItem.click();
                          await waitForElement('.ytp-menuitem', 2000);

                          const languageOptions = Array.from(document.querySelectorAll('.ytp-menuitem'));
                          const languageOption = languageOptions.find(option => option.textContent.trim() === selectedLanguage);
                          if (languageOption) languageOption.click();
                      }
                  } catch (error) {
                      console.error(error);
                  }
              },
              args: [language]
          });
      }
  });
}