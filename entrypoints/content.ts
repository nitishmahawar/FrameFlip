export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // The popup uses activeTab + scripting to operate only on the page the user opens it from.
  },
});
