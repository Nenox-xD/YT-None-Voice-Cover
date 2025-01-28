function disableAutoVoiceover() {
    const settingsButton = document.querySelector('.ytp-settings-button');

    if (settingsButton) {
        settingsButton.click();

        setTimeout(() => {
            const menuItems = document.querySelectorAll('.ytp-menuitem');

            menuItems.forEach((item) => {
                if (item.textContent.includes('Audio-Sprache')) {
                    item.click();

                    setTimeout(() => {
                        const originalLanguageOption = Array.from(document.querySelectorAll('.ytp-menuitem'))
                            .find(option => option.textContent.includes('Originalsprache'));

                        if (originalLanguageOption) {
                            originalLanguageOption.click();
                        }
                    }, 300);
                }
            });
        }, 300);
    }
}

window.addEventListener('load', () => {
    disableAutoVoiceover();
});

const observer = new MutationObserver(() => {
    disableAutoVoiceover();
});

observer.observe(document.body, { childList: true, subtree: true });