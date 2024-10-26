import { GM_addStyle, GM_getValue, GM_setValue, GM_listValues, GM_deleteValue, GM_xmlhttpRequest, GM_info } from '$';

/**
 * logSwitchがtrueの場合、ログを出力します
 * @param {any} content 出力コンテンツ。console.log関数で出力できるものはすべて受け付けます。
 */
const log = (content) => {
  if (!logSwitch) return;
  console.log(content);
};

/**
 * 設定項目を自動的に作成する
 * @param {String} categoryName
 * @param {Array<object>} settingsList
 */
const settingListGenerator = (categoryName, settingsList) => {
  const categoryTitle = document.createElement('p');
  categoryTitle.classList.add('bp-categoryTitle');
  categoryTitle.innerText = categoryName;
  document.querySelector('.bp-modalInner-sm').appendChild(categoryTitle);

  const settingsListElm = document.createElement('ul');
  settingsListElm.classList.add('bp-settingList');
  settingsList.forEach((setting) => {
    switch (setting.type) {
      case 0:
        settingsListElm.innerHTML += `<li><label class="bp-toggle-box"><input type="checkbox" name="${setting.id}" data-default="${setting.default}"/><div><div></div></div>${setting.label}</label></li>`;
        break;
      case 1:
        let optsHTML = '';
        setting.opts.forEach((opt) => {
          optsHTML += `<option value="${opt[0]}">${opt[1]}</option>`;
        });
        settingsListElm.innerHTML += `<li><label>${setting.label}: <select name="${setting.id}" data-default="${setting.default}">${optsHTML}</select></label></li>`;
        break;
    }
  });
  document.querySelector('.bp-modalInner-sm').appendChild(settingsListElm);
};

/**
 * 設定画面を開きます。
 */
const openSetting = () => {
  const settingModal = document.createElement('div');
  settingModal.classList.add('bp-modal');
  settingModal.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="bp-closeModalBtn bp-closeModalBtn-sm"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"></path></svg>
<div class="bp-modalInner bp-modalInner-sm"></div>
<div class="bp-settingBottom">
  <button class="bp-saveSettingBtn">${i18n.settings.save}</button>
  <button class="bp-resetSettingBtn">${i18n.settings.reset}</button>
</div>`;
  document.body.appendChild(settingModal);

  settingListGenerator(i18n.settings.general, settingList.general);
  settingListGenerator(i18n.settings.bookmarkAddEnhancer, settingList.bookmarkAddEnhancer);

  document.querySelectorAll('.bp-modal input[type="checkbox"]').forEach((elm) => {
    elm.checked = GM_getValue(elm.name, elm.getAttribute('data-default') == 'true' ? true : false);
  });
  document.querySelectorAll('.bp-modal select').forEach((elm) => {
    elm.value = GM_getValue(elm.name, elm.getAttribute('data-default'));
  });

  const settingModalBack = document.createElement('div');
  settingModalBack.classList.add('bp-modalBack');
  document.body.appendChild(settingModalBack);

  document.body.style.overflow = 'hidden';
  document.querySelector('.bp-closeModalBtn-sm').addEventListener('click', () => {
    settingModal.remove();
    settingModalBack.remove();
    document.body.style.overflow = '';
  });
  settingModalBack.addEventListener('click', () => {
    settingModal.remove();
    settingModalBack.remove();
    document.body.style.overflow = '';
  });

  document.querySelector('.bp-saveSettingBtn').addEventListener('click', () => {
    document.querySelectorAll('.bp-modal input[type="checkbox"]').forEach((elm) => {
      GM_setValue(elm.name, elm.checked);
    });
    document.querySelectorAll('.bp-modal select').forEach((elm) => {
      GM_setValue(elm.name, elm.value);
    });
    if (confirm(i18n.settings.confirmReload)) {
      location.reload();
    }
    settingModal.remove();
    settingModalBack.remove();
    document.body.style.overflow = '';
  });
  document.querySelector('.bp-resetSettingBtn').addEventListener('click', () => {
    if (!confirm(i18n.settings.confirmReset)) return;
    GM_listValues().forEach((key) => {
      GM_deleteValue(key);
    });
    if (confirm(i18n.settings.confirmReload)) {
      location.reload();
    }
    settingModal.remove();
    settingModalBack.remove();
    document.body.style.overflow = '';
  });
};

const getToken = (type, illustID, tries, svgBtnElm, restrictMode, artworksPageMode, errBypass) => {
  const url =
    type == 'addR18' || type == 'delR18' || errBypass ? 'https://www.pixiv.net/bookmark_new_illust.php' : location.href;
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    headers: {
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0`,
    },
    onload: (response) => {
      const html = response.responseText;
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const data = dom.querySelector('meta#meta-global-data');
      if (!data) {
        getToken(type, illustID, tries, svgBtnElm, restrictMode, artworksPageMode, true);
        return;
      }
      GM_setValue('bkm_token', JSON.parse(data.content).token);
      GM_setValue('bkm_tokenExpireTimestamp', Date.now() + 15 * 60 * 1000);
      log('[bp:bookmarkAddEnhancer] Got token');
      switch (type) {
        case 'add':
          addBookmark(illustID, tries, svgBtnElm, restrictMode, artworksPageMode);
          break;
        case 'addR18':
          addBookmarkR18Pages(illustID, tries, svgBtnElm, restrictMode);
          break;
        case 'del':
          deleteBookmark(illustID, tries, svgBtnElm, artworksPageMode);
          break;
        case 'delR18':
          deleteBookmarkR18Pages(illustID, tries, svgBtnElm);
      }
    },
  });
};

const addBookmark = (illustID, tries, svgElm, restrictMode, artworksPageMode) => {
  const url = `https://www.pixiv.net/ajax/illust/${illustID}`;
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload: (response) => {
      const tagData = JSON.parse(response.responseText);
      const tagBody = tagData.body;
      const tags = GM_getValue('bkm_addAllTags', true)
        ? [
            ...tagBody.tags.tags.map((tag) => {
              return tag.tag;
            }),
          ]
        : [];
      let isPrivate;
      switch (restrictMode) {
        case 2:
          // auto
          isPrivate = GM_getValue('bkm_alwaysPrivate', false);
          if (GM_getValue('bkm_r18Private', true) && (tags.includes('R-18') || tags.includes('R-18G'))) {
            isPrivate = true;
          }
          break;
        case 1:
          isPrivate = true;
          break;
        case 0:
          isPrivate = false;
          break;
      }

      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://www.pixiv.net/ajax/illusts/bookmarks/add',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json; charset=utf-8',
          'x-csrf-token': GM_getValue('bkm_token'),
        },
        data: JSON.stringify({
          illust_id: illustID,
          comment: '',
          restrict: isPrivate ? 1 : 0,
          tags: tags,
        }),
        onload: (response) => {
          const data = JSON.parse(response.responseText);
          if (data.error) {
            if (tries <= 2) getToken('add', illustID, tries + 1, svgElm, restrictMode, artworksPageMode);
            return;
          }
          let svg;
          if (isPrivate) {
            svg = `<path fill-rule="evenodd" clip-rule="evenodd" d="M21 5.5C24.866 5.5 28 8.63401 28 12.5C28 18.2694 24.2975 23.1517 17.2206 27.11C16.4622 27.5343 15.538 27.5343 14.7796 27.1101C7.7025 23.1517 4 18.2695 4 12.5C4 8.63401 7.13401 5.5 11 5.5C12.8298 5.5 14.621 6.4144 16 7.82824C17.379 6.4144 19.1702 5.5 21 5.5Z" fill="#FF4060"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M29.9796 20.5234C31.1865 21.2121 32 22.511 32 24V28C32 30.2091 30.2091 32 28 32H21C18.7909 32 17 30.2091 17 28V24C17 22.511 17.8135 21.2121 19.0204 20.5234C19.2619 17.709 21.623 15.5 24.5 15.5C27.377 15.5 29.7381 17.709 29.9796 20.5234Z" fill="white"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M28 22C29.1046 22 30 22.8954 30 24V28C30 29.1046 29.1046 30 28 30H21C19.8954 30 19 29.1046 19 28V24C19 22.8954 19.8954 22 21 22V21C21 19.067 22.567 17.5 24.5 17.5C26.433 17.5 28 19.067 28 21V22ZM23 21C23 20.1716 23.6716 19.5 24.5 19.5C25.3284 19.5 26 20.1716 26 21V22H23V21Z" fill="#1F1F1F"></path>`;
          } else {
            svg = `<path fill-rule="evenodd" clip-rule="evenodd" d="M21 5.5C24.866 5.5 28 8.63401 28 12.5C28 18.2694 24.2975 23.1517 17.2206 27.11C16.4622 27.5343 15.538 27.5343 14.7796 27.1101C7.7025 23.1517 4 18.2695 4 12.5C4 8.63401 7.13401 5.5 11 5.5C12.8298 5.5 14.621 6.4144 16 7.82824C17.379 6.4144 19.1702 5.5 21 5.5Z" fill="#FF4060"></path>`;
          }
          svgElm.innerHTML = svg;
          if (location.hash == '#discover') {
            svgElm.classList.remove('hgCyhg');
            return;
          }
          if (location.pathname == '/') {
            svgElm.classList.remove('fyVBNZ');
            return;
          }
          if (artworksPageMode) {
            document.querySelector(
              '.works-item-illust:has(.thumbnail.is-active) .bp-works-bookmark-button svg'
            ).innerHTML = svg;
            return;
          }
          if (location.pathname.split('/')[1] == 'artworks' && location.pathname.split('/')[2] == illustID) {
            document.querySelectorAll('.work-interactions .bp-works-bookmark-button').forEach((btn) => {
              btn.querySelector('svg').innerHTML = svg;
            });
          }
        },
      });
    },
  });
};

const deleteBookmark = (illustID, tries, svgElm, artworksPageMode) => {
  const url = `https://www.pixiv.net/ajax/illust/${illustID}`;
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload: (response) => {
      const bkmData = JSON.parse(response.responseText);
      const bkmBody = bkmData.body;
      if (!bkmBody.bookmarkData) {
        alert(i18n.bookmarkAddEnhancer.removeErr);
        return;
      }
      const bkmID = bkmBody.bookmarkData.id;
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://www.pixiv.net/ajax/illusts/bookmarks/delete',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          'x-csrf-token': GM_getValue('bkm_token'),
        },
        data: `bookmark_id=${bkmID}`,
        onload: (response) => {
          const data = JSON.parse(response.responseText);
          if (data.error) {
            if (tries <= 2) getToken('del', illustID, tries + 1, svgElm, null, artworksPageMode);
            return;
          }
          const svg = `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>`;
          svgElm.innerHTML = svg;
          if (location.hash == '#discover') {
            svgElm.classList.add('hgCyhg');
            return;
          }
          if (location.pathname == '/') {
            svgElm.classList.add('fyVBNZ');
            return;
          }
          if (artworksPageMode) {
            document.querySelector(
              '.works-item-illust:has(.thumbnail.is-active) .bp-works-bookmark-button svg'
            ).innerHTML = svg;
            return;
          }
          if (location.pathname.split('/')[1] == 'artworks' && location.pathname.split('/')[2] == illustID) {
            document.querySelectorAll('.work-interactions .bp-works-bookmark-button').forEach((btn) => {
              btn.querySelector('svg').innerHTML = svg;
            });
          }
        },
      });
    },
  });
};

const addBookmarkR18Pages = (illustID, tries, btnElm, restrictMode) => {
  const url = `https://www.pixiv.net/ajax/illust/${illustID}`;
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload: (response) => {
      const tagData = JSON.parse(response.responseText);
      const tagBody = tagData.body;
      const tags = GM_getValue('bkm_addAllTags', true)
        ? [
            ...tagBody.tags.tags.map((tag) => {
              return tag.tag;
            }),
          ]
        : [];
      let isPrivate;
      switch (restrictMode) {
        case 2:
          // auto
          isPrivate = GM_getValue('bkm_alwaysPrivate', false);
          if (GM_getValue('bkm_r18Private', true) && (tags.includes('R-18') || tags.includes('R-18G'))) {
            isPrivate = true;
          }
          break;
        case 1:
          isPrivate = true;
          break;
        case 0:
          isPrivate = false;
          break;
      }

      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://www.pixiv.net/ajax/illusts/bookmarks/add',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json; charset=utf-8',
          'x-csrf-token': GM_getValue('bkm_token'),
        },
        data: JSON.stringify({
          illust_id: illustID,
          comment: '',
          restrict: isPrivate ? 1 : 0,
          tags: tags,
        }),
        onload: (response) => {
          const data = JSON.parse(response.responseText);
          if (data.error) {
            if (tries <= 2) getToken('addR18', illustID, tries + 1, btnElm, restrictMode, null);
            return;
          }
          if (isPrivate) {
            btnElm.classList.add('done');
            btnElm.querySelector('.icon-like').classList.add('private');
          } else {
            btnElm.classList.add('done');
            btnElm.querySelector('.icon-like').classList.remove('private');
          }
        },
      });
    },
  });
};

const deleteBookmarkR18Pages = (illustID, tries, btnElm) => {
  const url = `https://www.pixiv.net/ajax/illust/${illustID}`;
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload: (response) => {
      const bkmData = JSON.parse(response.responseText);
      const bkmBody = bkmData.body;
      if (!bkmBody.bookmarkData) {
        alert(i18n.bookmarkAddEnhancer.removeErr);
        return;
      }
      const bkmID = bkmBody.bookmarkData.id;
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://www.pixiv.net/ajax/illusts/bookmarks/delete',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
          'x-csrf-token': GM_getValue('bkm_token'),
        },
        data: `bookmark_id=${bkmID}`,
        onload: (response) => {
          const data = JSON.parse(response.responseText);
          if (data.error) {
            if (tries <= 2) getToken('delR18', illustID, tries + 1, svgElm, null, null);
            return;
          }
          btnElm.classList.remove('done');
          btnElm.querySelector('.icon-like').classList.remove('private');
        },
      });
    },
  });
};

const bkmOptsModalGenerator = (isAddUI) => {
  const bkmOptsModal = document.createElement('div');
  bkmOptsModal.classList.add('bp-modal-small');
  if (isAddUI) {
    bkmOptsModal.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="bp-closeModalBtn bp-closeModalBtn-bkmOpts"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"></path></svg>
<button class="bp-bkmOptBtn pb-bkmOptPublic">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="margin-right: 5px;">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M21 5.5C24.866 5.5 28 8.63401 28 12.5C28 18.2694 24.2975 23.1517 17.2206 27.11C16.4622 27.5343 15.538 27.5343 14.7796 27.1101C7.7025 23.1517 4 18.2695 4 12.5C4 8.63401 7.13401 5.5 11 5.5C12.8298 5.5 14.621 6.4144 16 7.82824C17.379 6.4144 19.1702 5.5 21 5.5Z" fill="#FF4060"></path>
  </svg>${i18n.bookmarkAddEnhancer.bkmPublic}
</button>
<button class="bp-bkmOptBtn pb-bkmOptPrivate">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="margin-right: 5px;">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M21 5.5C24.866 5.5 28 8.63401 28 12.5C28 18.2694 24.2975 23.1517 17.2206 27.11C16.4622 27.5343 15.538 27.5343 14.7796 27.1101C7.7025 23.1517 4 18.2695 4 12.5C4 8.63401 7.13401 5.5 11 5.5C12.8298 5.5 14.621 6.4144 16 7.82824C17.379 6.4144 19.1702 5.5 21 5.5Z" fill="#FF4060"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M29.9796 20.5234C31.1865 21.2121 32 22.511 32 24V28C32 30.2091 30.2091 32 28 32H21C18.7909 32 17 30.2091 17 28V24C17 22.511 17.8135 21.2121 19.0204 20.5234C19.2619 17.709 21.623 15.5 24.5 15.5C27.377 15.5 29.7381 17.709 29.9796 20.5234Z" fill="white"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M28 22C29.1046 22 30 22.8954 30 24V28C30 29.1046 29.1046 30 28 30H21C19.8954 30 19 29.1046 19 28V24C19 22.8954 19.8954 22 21 22V21C21 19.067 22.567 17.5 24.5 17.5C26.433 17.5 28 19.067 28 21V22ZM23 21C23 20.1716 23.6716 19.5 24.5 19.5C25.3284 19.5 26 20.1716 26 21V22H23V21Z" fill="#1F1F1F"></path>
  </svg>${i18n.bookmarkAddEnhancer.bkmPrivate}
</button>`;
  } else {
    bkmOptsModal.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="bp-closeModalBtn bp-closeModalBtn-bkmOpts"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"></path></svg>
<button class="bp-bkmOptBtn pb-bkmOptDelete">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="margin-right: 5px;">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>
  </svg>${i18n.bookmarkAddEnhancer.bkmDelete}
</button>`;
  }
  document.body.appendChild(bkmOptsModal);

  const bkmOptsModalBack = document.createElement('div');
  bkmOptsModalBack.classList.add('bp-modalBack');
  document.body.appendChild(bkmOptsModalBack);

  document.body.style.overflow = 'hidden';
  bkmOptsModal.querySelector('.bp-closeModalBtn-bkmOpts').addEventListener('click', () => {
    bkmOptsModal.remove();
    bkmOptsModalBack.remove();
    document.body.style.overflow = '';
  });
  bkmOptsModalBack.addEventListener('click', () => {
    bkmOptsModal.remove();
    bkmOptsModalBack.remove();
    document.body.style.overflow = '';
  });
  return [bkmOptsModal, bkmOptsModalBack];
};

const themeChange = (isDark) => {
  let UIValueLib;
  if (isDark) {
    UIValueLib = {
      modalBg: '#1f1f1f',
      modalColor: '#fff',
      modalBackBg: '#00000055',
      inputBg: '#454545',
    };
  } else {
    UIValueLib = {
      modalBg: '#fff',
      modalColor: '#000',
      modalBackBg: '#ffffff55',
      inputBg: '#e3e3e3',
    };
  }
  document.querySelector('#bp-UIStyle').textContent = `[class^='bp-']{box-sizing: border-box;}

/* 設定リンク */
.bp-openSettingLink{
  cursor: pointer;
}
/* モーダル全般 */
.bp-modalBack{
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000000009;
  width: 100vw;
  height: 100vh;
  background: ${UIValueLib.modalBackBg};
  
}
.bp-modal{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000000010;
  width: 90vw;
  height: 90vh;
  background: ${UIValueLib.modalBg};
  fill: ${UIValueLib.modalColor};
  color: ${UIValueLib.modalColor};
  border-radius: 10px;
}
.bp-modal-small{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000000010;
  width: 80vw;
  height: 30vh;
  background: ${UIValueLib.modalBg};
  fill: ${UIValueLib.modalColor};
  color: ${UIValueLib.modalColor};
  border-radius: 10px;
}
.bp-modal a, .bp-modal-small a{
  color: #0096fa !important;
  text-decoration: underline !important;
}
.bp-modalInner{
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  margin: 0;
  padding: 20px;
  padding-bottom: 80px;
}
.bp-closeModalBtn{
  position:absolute;
  width: 30px;
  height: 30px;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
.bp-categoryTitle{
  margin: 10px 0;
  font-size: 25px;
}

/* Setting Modal */
.bp-settingList{
  list-style: none;
  padding: 0;
}
.bp-settingList li{
  margin: 10px 0;
}
.bp-settingBottom {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  background: ${UIValueLib.modalBackBg};
  padding: 15px;
  left: 0;
  height: 70px;
}
.bp-saveSettingBtn, .bp-resetSettingBtn {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
}
.bp-saveSettingBtn {
  background: #0a0;
}
.bp-resetSettingBtn {
  background: #a00;
}
.bp-toggle-box {display: block;width: fit-content;cursor: pointer;}
.bp-toggle-box * {margin: 0;}
.bp-toggle-box input {display: none;}
.bp-toggle-box input + div {display: inline-block;vertical-align: middle;margin-right: 10px;width: 50px;height: 24px;padding:2px;border-radius: 20px;background: #8a8a8a;position: relative;}
.bp-toggle-box input:checked + div {background: #0096fa;}
.bp-toggle-box input + div div {position: absolute;width: 24px;height: 24px;background: #ffffff;border-radius: 12px;top: 2px;left: 4%;transition: left 0.05s linear;}
.bp-toggle-box input:checked + div div {left: 52%;}

/* Search Enhancer */
.bp-favoriteFilterUI {
  margin: 10px auto;
  width: fit-content;
}
.bp-favoriteFilterUI span {
  color: ${UIValueLib.modalColor};
}
.bp-favoriteFilterUI span:nth-of-type(1) {
  margin-right: 5px;
}
.bp-favoriteFilterUI span:nth-of-type(2) {
  margin: 0 10px;
}
.bp-favoriteFilterUI select, .bp-modal select {
  color: ${UIValueLib.modalColor};
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background: ${UIValueLib.inputBg};
  appearance: auto;
}
.bp-favoriteFilterUI button {
  padding: 5px 10px;
  width: fit-content;
  margin: 10px auto 0;
  display: block;
  border: none;
  border-radius: 5px;
  background: #0096fa;
  color: #fff;
  cursor: pointer;
}
/* bigPicturePaging */
.bp-bigPicturePrev, .bp-bigPictureNext{
  font-size: 30px;
  color: #fff;
  top: 50%;
  position: fixed;
  cursor: pointer;
}
.bp-bigPicturePrev{
  -webkit-transition: left .2s;
  transition: left .2s;
  left: 10px;
}
.bp-bigPictureNext{
  -webkit-transition: right .2s;
  transition: right .2s;
  right: 10px;
}
.controls-hidden .bp-bigPicturePrev{
  left: -46px;
}
.controls-hidden .bp-bigPictureNext {
  right: -46px;
}
.bp-nav-back{
  left: 10px;
  position: fixed;
  top: 10px;
  -webkit-transition: left .2s;
  transition: left .2s;
}
.controls-hidden .bp-nav-back {
  left: -46px;
}

/* addBookmarkEnhancer */
.bp-works-bookmark-button{
  cursor: pointer;
  line-height: 0;
}
.bp-bkmOptBtn{
  display: block;
  padding: 5px 10px;
  width: fit-content;
  margin: 20px auto ;
  border: none;
  border-radius: 5px;
  background: #0096fa;
  color: #fff;
  cursor: pointer;
}
.bp-btn-like{
  background: none;
  border: none;
  border-radius: 0;
  cursor: pointer;
  float: left;
  margin: 0;
  padding: 0;
  width: 32px;
}
.bp-btn-like .icon-like{
  display: inline-block;
  background-size: 100% 100% !important;
  height: 32px !important;
  width: 32px !important;
  background: url(https://s.pximg.net/touch/touch/js/bundle/633144bb1bc226b8691dab87ed039000.png) no-repeat;
}
.bp-btn-like.done .icon-like{
  background: url(https://s.pximg.net/touch/touch/js/bundle/4350a1d947ba45e1213a5af082fc4f7a.png) no-repeat;
}
.bp-btn-like.done .icon-like.private{
  background-image: linear-gradient(transparent,transparent),url(https://s.pximg.net/touch/touch/js/bundle/e1053a5f868421ba37e7222cb1dbdd4f.svg);
}`;
};

// i18n
let i18n;
const i18nLib = {
  en: {
    settings: {
      general: 'General',
      save: 'Save',
      reset: 'Reset',
      confirmReload: 'Reloading is required for some settings to take effect. Do you want to reload?',
      confirmReset: 'Reset all settings. Are you sure?',
      language: 'Language',
      auto: 'Auto',
      outputLog: 'Output Logs',
      adRemover: 'Ad Remover',
      searchEnhancer: 'Search Enhancement',
      bigPicturePaging: 'Paging when enlarging images',
      bookmarkAddEnhancer: 'Enhanced bookmark addition functionality',
    },
    searchEnhancer: {
      bookmarksNum: 'Bookmarks Num:',
      filter: 'Filter',
    },
    updateModal: {
      title: 'BetterPixivMobile has been updated to v%0',
      body: 'Please check <a href="https://github.com/irohosi-pixel/BetterPixivMobile/releases/tag/v%0" target="_blank" rel="noopener noreferrer">here</a> for updates.',
      check: 'Do not show this notice next time',
    },
    firstRunModal: {
      title: 'BetterPixivMobile is now installed',
      body: 'Thank you for installing this script.<br>Please be sure to read the disclaimer in the <a href="https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/README.md" target="_blank" rel="noopener noreferrer">README</a>.',
      check: 'Do not show this notice next time',
    },
    bookmarkAddEnhancer: {
      alwaysAllTagAdd: 'Always add all artwork tags to the bookmark tag',
      alwaysPrivate: 'Always bookmark as private',
      r18Private: 'Bookmark as private if the work is marked as R-18 or R-18G',
      bkmPublic: 'Bookmark as public',
      bkmPrivate: 'Bookmark as private',
      bkmDelete: 'Delete bookmark',
      removeErr: 'Failed to delete bookmark. Please wait until your bookmark information is reflected on pixiv.',
    },
  },
  ja: {
    settings: {
      general: '一般',
      save: '保存',
      reset: 'リセット',
      confirmReload: '一部の設定を反映するためにはリロードする必要があります。リロードしますか？',
      confirmReset: 'すべての設定をリセットします。よろしいですか？',
      language: '言語',
      auto: '自動',
      outputLog: 'ログ出力',
      adRemover: '広告非表示',
      searchEnhancer: '検索機能強化',
      bigPicturePaging: '画像拡大時のページめくり',
      bookmarkAddEnhancer: 'ブックマーク追加機能強化',
    },
    searchEnhancer: {
      bookmarksNum: 'ブックマーク数:',
      filter: 'フィルタ',
    },
    updateModal: {
      title: 'BetterPixivMobileがv%0に更新されました',
      body: '更新情報は<a href="https://github.com/irohosi-pixel/BetterPixivMobile/releases/tag/v%0" target="_blank" rel="noopener noreferrer">こちら</a>から確認してください。',
      check: 'このお知らせを次から表示しない',
    },
    firstRunModal: {
      title: 'BetterPixivMobileがインストールされました',
      body: 'インストールしていただきありがとうございます。<br><a href="https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/README_ja.md" target="_blank" rel="noopener noreferrer">README</a>に免責事項が記載されていますので、必ずご確認ください。',
      check: 'このお知らせを次から表示しない',
    },
    bookmarkAddEnhancer: {
      alwaysAllTagAdd: '常にブックマークタグに作品タグをすべて追加する',
      alwaysPrivate: '常に非公開でブックマークする',
      r18Private: '作品がR-18またはR-18G指定の場合非公開でブックマークする',
      bkmPublic: '公開でブックマーク',
      bkmPrivate: '非公開でブックマーク',
      bkmDelete: 'ブックマークを解除',
      removeErr: 'ブックマーク解除に失敗しました。ブックマークの登録情報がpixiv側で反映されるまでお待ちください。',
    },
  },
};
let lang = GM_getValue('language', 'auto');
if (lang == 'auto') lang = document.documentElement.lang;
switch (lang) {
  case 'en':
    i18n = i18nLib.en;
    break;
  case 'ja':
    i18n = i18nLib.ja;
    break;
  default:
    i18n = i18nLib.en;
    break;
}

const logSwitch = GM_getValue('sw_logOutput', false);
const pluginSwitch = {
  updateUIStyle_html: true,
  updateUIStyle_body: true,
  settings: true,
  adRemover: GM_getValue('sw_adRemover', true),
  searchEnhancer: GM_getValue('sw_searchEnhancer', true),
  bigPicturePaging: GM_getValue('sw_bigPicturePaging', true),
  bookmarkAddEnhancer: GM_getValue('sw_bookmarkAddEnhancer', true),
};

/**
 * 設定モーダルの設定項目
 */
const settingList = {
  general: [
    {
      type: 1,
      label: i18n.settings.language,
      id: 'language',
      opts: [
        ['auto', i18n.settings.auto],
        ['en', 'English'],
        ['ja', '日本語'],
      ],
      default: 'auto',
    },
    {
      type: 0,
      label: i18n.settings.outputLog,
      id: 'sw_logOutput',
      default: false,
    },
    {
      type: 0,
      label: i18n.settings.adRemover,
      id: 'sw_adRemover',
      default: true,
    },
    {
      type: 0,
      label: i18n.settings.searchEnhancer,
      id: 'sw_searchEnhancer',
      default: true,
    },
    {
      type: 0,
      label: i18n.settings.bigPicturePaging,
      id: 'sw_bigPicturePaging',
      default: true,
    },
    {
      type: 0,
      label: i18n.settings.bookmarkAddEnhancer,
      id: 'sw_bookmarkAddEnhancer',
      default: true,
    },
  ],
  bookmarkAddEnhancer: [
    {
      type: 0,
      label: i18n.bookmarkAddEnhancer.alwaysAllTagAdd,
      id: 'bkm_addAllTags',
      default: true,
    },
    {
      type: 0,
      label: i18n.bookmarkAddEnhancer.r18Private,
      id: 'bkm_r18Private',
      default: true,
    },
    {
      type: 0,
      label: i18n.bookmarkAddEnhancer.alwaysPrivate,
      id: 'bkm_alwaysPrivate',
      default: false,
    },
  ],
};

// UIスタイル要素を追加
const UIStyleElm = document.createElement('style');
UIStyleElm.id = 'bp-UIStyle';
document.head.appendChild(UIStyleElm);
if (document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') == 'dark') {
  themeChange(true);
} else {
  themeChange(false);
}

let cachedTagPagePathname;
let cachedHrefMOManager = location.href;
let cachedArtworksPageID;
let cachedArtworksPageIDManga;
let maxPageNum;

if (GM_getValue('bkm_token', null) !== null) {
  GM_deleteValue('bkm_token');
}

// ページ判定
const isTagsPage = () => /^\/tags\//.test(location.pathname);
const isArtworksPage = () => /^\/artworks\//.test(location.pathname);

/**  各プラグインの構成方法
 *
 * 0. プラグイン名: 文字列
 * 1. プラグイン関数: アロー関数
 * 2. MOにするか: 真偽値
 * 3. 実行ページ判定関数
 * 4. MO保存用: null
 * 5. 通常関数の場合すでに実行したかどうか。
 * MOコールバックの場合、現在監視中かどうか。
 */
let plugins = [
  [
    'updateUIStyle_html',
    (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type != 'attributes' || mutation.attributeName != 'data-theme') return;
        if (document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') == 'dark') {
          themeChange(true);
        } else {
          themeChange(false);
        }
      }
    },
    true,
    () => true,
    null,
    false,
    {
      target: document.documentElement,
      config: { attributes: true },
    },
  ],
  [
    'updateUIStyle_body',
    (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type != 'attributes' || mutation.attributeName != 'class') return;
        if (document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') == 'dark') {
          themeChange(true);
        } else {
          themeChange(false);
        }
      }
    },
    true,
    () => true,
    null,
    false,
    {
      target: document.body,
      config: { attributes: true },
    },
  ],
  [
    'settings',
    (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (
          mutation.type != 'childList' ||
          document.querySelector(
            '.wc-menu li:has(a[href="/settings"]), .wc-menu li:has(a[href="/settings.php"]), .sc-d7b0bc-4 > div:nth-child(1) > div:nth-child(3) > ul:nth-child(12) > li:nth-child(6):has(> a[href="/settings.php"])'
          ) == null ||
          document.querySelector('.bp-openSettingLink') != null
        )
          return;
        const openSettingLink = document.createElement('li');
        openSettingLink.classList.add('sc-795f1f7d-11', 'btQgeu');
        openSettingLink.innerHTML = `<span class="bp-openSettingLink">BetterPixiv</span>`;
        document
          .querySelector(
            '.wc-menu li:has(a[href="/settings"]), .wc-menu li:has(a[href="/settings.php"]), .sc-d7b0bc-4 > div:nth-child(1) > div:nth-child(3) > ul:nth-child(12) > li:nth-child(6):has(> a[href="/settings.php"])'
          )
          .after(openSettingLink);
        document.querySelector('.bp-openSettingLink').addEventListener('click', openSetting);
      }
    },
    true,
    () => true,
    null,
    false,
    {
      target: document.body,
      config: { childList: true, subtree: true },
    },
  ],
  [
    'adRemover',
    () => {
      GM_addStyle(
        `[class*='ad-']:not([class*='upload-']), [id*='adsdk'], .grid_ad/* 広告要素全般 */,
.overlay:has(div.ad-frame-headerbidding), img[src="https://works.gsspcln.jp/w/ad_format/close_icons/close_icon_bold.png"] /* ページ下部固定広告 */,
[class*='premium-']:not(.premium-icon-after), a[href^='/premium'] /* プレミアム登録要素全般 */,
.wc-menu .premium-icon-after[href='/history.php']::after, .sc-795f1f7d-10 .jarFFK[href='/history.php']::after /* スライドメニューの履歴リンクのプレミアムアイコン */,
.wc-menu li:has(.premium-icon-after[href='/settings/viewing?type=ads']), .wc-menu li:has(.premium-icon-after[href='/settings.php?mode=ads']), .sc-795f1f7d-16 li:has(.jarFFK[href='/settings.php?mode=ads']) /* スライドメニューの広告非表示リンク */,
div[class='flex py-16 gap-24 screen1:px-0 screen1:flex-col screen1:gap-0 screen1:mx-16 border-0 border-solid border-border border-b box-border border-none screen1:border-solid relative']:has(iframe[src='https://imp.pixiv.net/premium_lp?g=anchor&i=settings_hide_ads&d=touch']) /* 設定ページ＞閲覧と表示 広告非表示 */,
div[class='mt-16 relative flex flex-col']:has(a[href='/premium/lead/lp?g=anchor&i=settings_mute_tag_search&lp_type=visitor']) /* 設定ページ＞閲覧と表示＞ミュート タグ検索 */,
.works-hide-screen /* 閲覧履歴の白いフェード */
{display: none !important;}`
      );
      log('[bp:adRemover] initialization success');
    },
    false,
    () => true,
    null,
    false,
  ],
  [
    'searchEnhancer',
    (mutationList, observer) => {
      const numList = [
        '5',
        '10',
        '30',
        '50',
        '100',
        '200',
        '250',
        '300',
        '500',
        '800',
        '1000',
        '3000',
        '5000',
        '7500',
        '10000',
        '30000',
        '50000',
        '100000',
        '200000',
        '300000',
        '400000',
        '500000',
        '600000',
        '700000',
        '800000',
      ];
      for (const mutation of mutationList) {
        if (mutation.type != 'childList') continue;
        if (document.querySelector('.total-num') != null && document.querySelector('.bp-favoriteFilterUI') == null) {
          const favoriteFilterUI = document.createElement('div');
          favoriteFilterUI.classList.add('bp-favoriteFilterUI');
          favoriteFilterUI.innerHTML = `<span>${i18n.searchEnhancer.bookmarksNum}</span>
<select></select><span>~</span><select></select>
<button>${i18n.searchEnhancer.filter}</button>`;
          document.querySelector('.total-num').after(favoriteFilterUI);

          numList.forEach((num) => {
            favoriteFilterUI.querySelector(
              'select:nth-of-type(1)'
            ).innerHTML += `<option value="${num}">${num}</option>`;
            favoriteFilterUI.querySelector('select:nth-of-type(2)').innerHTML =
              `<option value="${num}">${num}</option>` +
              favoriteFilterUI.querySelector('select:nth-of-type(2)').innerHTML;
          });
        }
        if (document.querySelector('.bp-favoriteFilterUI') != null && cachedTagPagePathname != location.pathname) {
          cachedTagPagePathname = location.pathname;
          let decodedPathname = decodeURI(location.pathname);
          decodedPathname += /\/tags\/(.+)\//.test(decodedPathname) ? '' : '/';
          const regexBetween = /\/tags\/(.+)\ \((\d+)user .+ (\d+)user\)\//;
          const regexOneNum = /\/tags\/(.+)\ (\d+)user\//;
          const regexNoNum = /\/tags\/(.+)\//;

          let tag;
          if (regexBetween.test(decodedPathname)) {
            tag = decodedPathname.match(regexBetween)[1];
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(1)').value =
              decodedPathname.match(regexBetween)[2];
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(2)').value =
              decodedPathname.match(regexBetween)[3];
          } else if (regexOneNum.test(decodedPathname)) {
            tag = decodedPathname.match(regexOneNum)[1];
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(1)').value =
              decodedPathname.match(regexOneNum)[2];
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(2)').value =
              decodedPathname.match(regexOneNum)[2];
          } else {
            tag = decodedPathname.match(regexNoNum)[1];
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(1)').value = 5;
            document.querySelector('.bp-favoriteFilterUI select:nth-of-type(2)').value = 800000;
          }

          document.querySelector('.bp-favoriteFilterUI button').addEventListener('click', () => {
            const selectedNumList = [
              document.querySelector('.bp-favoriteFilterUI select:nth-of-type(1)').value,
              document.querySelector('.bp-favoriteFilterUI select:nth-of-type(2)').value,
            ];
            selectedNumList.sort((a, b) => a - b);

            let favoriteFilterStr;
            if (selectedNumList[0] == selectedNumList[1]) {
              favoriteFilterStr = `${selectedNumList[0]}user`;
            } else {
              favoriteFilterStr = '(';
              for (
                let index = numList.findIndex((elm) => elm == selectedNumList[0]);
                index < numList.findIndex((elm) => elm == selectedNumList[1]);
                index++
              ) {
                favoriteFilterStr += `${numList[index]}user OR `;
              }
              favoriteFilterStr += `${selectedNumList[1]}user)`;
            }

            if (location.search == '') {
              location.href = encodeURI(
                decodeURI(location.href).replace(regexNoNum, `/tags/${tag} ${favoriteFilterStr}/`) + '?s_mode=s_tag'
              );
              return;
            }
            const hashes = {};
            const parameters = location.search.split(/&|\?/).filter((value) => {
              return value.includes('=');
            });
            parameters.forEach((parameter) => {
              const parameterList = parameter.split('=');
              const key = parameterList[0];
              const value = decodeURIComponent(parameterList[1]);
              hashes[key] = value;
            });
            if (hashes['s_mode'] == undefined) {
              location.href = encodeURI(
                decodeURI(location.href).replace(regexNoNum, `/tags/${tag} ${favoriteFilterStr}/`) + '&s_mode=s_tag'
              );
              return;
            }
            if (hashes['s_mode'] == 's_tc') {
              location.href = encodeURI(
                decodeURI(location.href)
                  .replace(regexNoNum, `/tags/${tag} ${favoriteFilterStr}/`)
                  .replace('s_mode=s_tc', 's_mode=s_tag')
              );
              return;
            }
            location.href = encodeURI(
              decodeURI(location.href).replace(regexNoNum, `/tags/${tag} ${favoriteFilterStr}/`)
            );
          });
        }
      }
    },
    true,
    () => isTagsPage(),
    null,
    false,
    {
      target: document.body,
      config: { childList: true, subtree: true },
    },
  ],
  [
    'bigPicturePaging',
    (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type != 'childList') return;
        if (
          /#big_\d+/.test(location.hash) &&
          !document.querySelector('.bp-bigPicturePrev') &&
          document.querySelector('button.nav-back')
        ) {
          const url = 'https://www.pixiv.net/ajax/illust/' + location.pathname.split('/')[2];

          GM_xmlhttpRequest({
            method: 'GET',
            url,
            onload: (response) => {
              const data = JSON.parse(response.responseText);
              const body = data.body;
              maxPageNum = body.pageCount - 1;
              if (document.querySelector('.bp-bigPicturePrev')) {
                if (new Number(location.hash.match(/#big_(\d+)/)[1]) == 0) {
                  document.querySelector('.bp-bigPicturePrev').style.display = 'none';
                } else {
                  document.querySelector('.bp-bigPicturePrev').style.display = '';
                }
                if (new Number(location.hash.match(/#big_(\d+)/)[1]) == maxPageNum) {
                  document.querySelector('.bp-bigPictureNext').style.display = 'none';
                } else {
                  document.querySelector('.bp-bigPictureNext').style.display = '';
                }
              }
            },
          });
          const customizedBtn = document.querySelector('button.nav-back').cloneNode(true);
          customizedBtn.classList.remove('nav-back');
          customizedBtn.classList.add('bp-nav-back');
          customizedBtn.addEventListener('click', () => {
            location.hash = '';
          });
          document.querySelector('button.nav-back').after(customizedBtn);
          document.querySelector('button.nav-back').remove();
          document.querySelector('button.bp-nav-back').insertAdjacentHTML(
            'afterend',
            `<button class="bp-bigPicturePrev" data-v-41bf3eea="">&lt;</button>
      <button class="bp-bigPictureNext" data-v-41bf3eea="">&gt;</button>`
          );
          document.querySelector('.bp-bigPicturePrev').addEventListener('click', () => {
            location.hash = `#big_${new Number(location.hash.match(/#big_(\d+)/)[1]) - 1}`;
          });
          document.querySelector('.bp-bigPictureNext').addEventListener('click', () => {
            location.hash = `#big_${new Number(location.hash.match(/#big_(\d+)/)[1]) + 1}`;
          });
        }
        if (document.querySelector('.bp-bigPicturePrev')) {
          if (new Number(location.hash.match(/#big_(\d+)/)[1]) == 0) {
            document.querySelector('.bp-bigPicturePrev').style.display = 'none';
          } else {
            document.querySelector('.bp-bigPicturePrev').style.display = '';
          }
          if (new Number(location.hash.match(/#big_(\d+)/)[1]) == maxPageNum) {
            document.querySelector('.bp-bigPictureNext').style.display = 'none';
          } else {
            document.querySelector('.bp-bigPictureNext').style.display = '';
          }
        }
      }
    },
    true,
    () => isArtworksPage(),
    null,
    false,
    {
      target: document.body,
      config: { childList: true, subtree: true },
    },
  ],
  [
    'bookmarkAddEnhancer',
    (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type != 'childList') return;
        document.querySelectorAll('.works-item-illust').forEach((item) => {
          if (!item.querySelector('.works-bookmark-button')) {
            return;
          }

          const illustID = item.getAttribute('data-tx');
          if (illustID == item.getAttribute('data-bp-illust-id')) return;
          item.setAttribute('data-bp-illust-id', illustID);

          if (item.querySelector('.bp-works-bookmark-button')) item.querySelector('.bp-works-bookmark-button').remove();

          const customizedBtn = item.querySelector('.works-bookmark-button').cloneNode(true);

          customizedBtn.classList.remove('works-bookmark-button');
          customizedBtn.classList.add('bp-works-bookmark-button');
          customizedBtn.style.display = 'block';
          customizedBtn.addEventListener('click', () => {
            if (
              customizedBtn.querySelector('svg').innerHTML ==
              `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>`
            ) {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 2, false);
              } else {
                getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 2, false);
              }
            } else {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), false);
              } else {
                getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, false);
              }
            }
          });
          customizedBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (
              customizedBtn.querySelector('svg').innerHTML ==
              `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>`
            ) {
              const modalElms = bkmOptsModalGenerator(true);
              modalElms[0].querySelector('.pb-bkmOptPublic').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 0, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 0, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
              modalElms[0].querySelector('.pb-bkmOptPrivate').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 1, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 1, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            } else {
              const modalElms = bkmOptsModalGenerator(false);
              modalElms[0].querySelector('.pb-bkmOptDelete').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), false);
                } else {
                  getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            }
          });

          item.querySelector('.works-bookmark-button').style.display = 'none';
          item.querySelector('.bookmark').appendChild(customizedBtn);
        });

        document.querySelectorAll('[data-ga4-label="work_content"]').forEach((item) => {
          const illustID = item.getAttribute('data-ga4-entity-id').split('/')[1];
          if (item.getAttribute('data-bp-illust-id') == illustID) return;
          item.setAttribute('data-bp-illust-id', illustID);

          if (item.querySelector('.bp-works-bookmark-button')) item.querySelector('.bp-works-bookmark-button').remove();

          const customizedBtn = item.querySelector('[data-ga4-label="bookmark_button"]').cloneNode(true);

          customizedBtn.removeAttribute('data-ga4-label');
          customizedBtn.classList.add('bp-works-bookmark-button');
          customizedBtn.addEventListener('click', () => {
            if (customizedBtn.querySelector('svg').classList.contains('fyVBNZ')) {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 2, false);
              } else {
                getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 2, false);
              }
            } else {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), false);
              } else {
                getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, false);
              }
            }
          });
          customizedBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (customizedBtn.querySelector('svg').classList.contains('fyVBNZ')) {
              const modalElms = bkmOptsModalGenerator(true);
              modalElms[0].querySelector('.pb-bkmOptPublic').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 0, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 0, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
              modalElms[0].querySelector('.pb-bkmOptPrivate').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 1, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 1, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            } else {
              const modalElms = bkmOptsModalGenerator(false);
              modalElms[0].querySelector('.pb-bkmOptDelete').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), false);
                } else {
                  getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            }
          });

          setTimeout(() => {
            item.querySelector('[data-ga4-label="bookmark_button"]').remove();
          }, 1000);
          item.querySelector('[data-ga4-label="bookmark_button"]').after(customizedBtn);
        });

        document.querySelectorAll(`div:has(> div > div >a[data-gtm-value])`).forEach((item) => {
          const illustID = item.querySelector('a[data-gtm-value]').getAttribute('data-gtm-value');
          if (item.getAttribute('data-bp-illust-id') == illustID) return;
          item.setAttribute('data-bp-illust-id', illustID);

          if (item.querySelector('.bp-works-bookmark-button')) item.querySelector('.bp-works-bookmark-button').remove();

          const customizedBtn = item.querySelector('[data-ga4-label="bookmark_button"]').cloneNode(true);

          customizedBtn.removeAttribute('data-ga4-label');
          customizedBtn.classList.add('bp-works-bookmark-button');
          customizedBtn.style.display = 'block';
          customizedBtn.addEventListener('click', () => {
            if (customizedBtn.querySelector('svg').classList.contains('hgCyhg')) {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 2, false);
              } else {
                getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 2, false);
              }
            } else {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), false);
              } else {
                getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, false);
              }
            }
          });
          customizedBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            if (customizedBtn.querySelector('svg').classList.contains('hgCyhg')) {
              const modalElms = bkmOptsModalGenerator(true);
              modalElms[0].querySelector('.pb-bkmOptPublic').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 0, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 0, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
              modalElms[0].querySelector('.pb-bkmOptPrivate').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 1, false);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 1, false);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            } else {
              const modalElms = bkmOptsModalGenerator(false);
              modalElms[0].querySelector('.pb-bkmOptDelete').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), true);
                } else {
                  getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, true);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            }
          });

          item.querySelector('[data-ga4-label="bookmark_button"]').style.display = 'none';
          item.querySelector('[data-ga4-label="bookmark_button"]').after(customizedBtn);
        });

        document.querySelectorAll('.work-interactions').forEach((item) => {
          if (!item.querySelector('.works-bookmark-button')) {
            return;
          }

          const illustID = location.pathname.split('/')[2];
          if (location.hash == '#manga') {
            if (illustID == cachedArtworksPageIDManga) return;
            cachedArtworksPageIDManga = illustID;
          } else {
            if (illustID == cachedArtworksPageID) return;
            cachedArtworksPageID = illustID;
          }

          if (item.querySelector('.bp-works-bookmark-button')) item.querySelector('.bp-works-bookmark-button').remove();

          const customizedBtn = item.querySelector('.works-bookmark-button').cloneNode(true);

          customizedBtn.classList.remove('works-bookmark-button');
          customizedBtn.classList.add('bp-works-bookmark-button');
          customizedBtn.style.display = 'block';
          customizedBtn.addEventListener('click', () => {
            if (
              customizedBtn.querySelector('svg').innerHTML ==
              `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>`
            ) {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 2, true);
              } else {
                getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 2, true);
              }
            } else {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), true);
              } else {
                getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, true);
              }
            }
          });
          customizedBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            if (
              customizedBtn.querySelector('svg').innerHTML ==
              `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9.36771C17.2648 7.66742 19.1383 6.5 21 6.5C24.3137 6.5 27 9.18629 27 12.5C27 17.854 23.5228 22.4393 16.7322 26.2374C16.2772 26.4919 15.7228 26.4919 15.2678 26.2374C8.47724 22.4393 5 17.854 5 12.5C5 9.18629 7.68629 6.5 11 6.5C12.8617 6.5 14.7352 7.66742 16 9.36771Z" fill="white" stroke="#1F1F1F" stroke-width="2"></path>`
            ) {
              const modalElms = bkmOptsModalGenerator(true);
              modalElms[0].querySelector('.pb-bkmOptPublic').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 0, true);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 0, true);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
              modalElms[0].querySelector('.pb-bkmOptPrivate').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmark(illustID, 0, customizedBtn.querySelector('svg'), 1, true);
                } else {
                  getToken('add', illustID, 1, customizedBtn.querySelector('svg'), 1, true);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            } else {
              const modalElms = bkmOptsModalGenerator(false);
              modalElms[0].querySelector('.pb-bkmOptDelete').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  deleteBookmark(illustID, 0, customizedBtn.querySelector('svg'), true);
                } else {
                  getToken('del', illustID, 1, customizedBtn.querySelector('svg'), null, true);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            }
          });

          item.querySelector('.works-bookmark-button').style.display = 'none';
          item.querySelector('.works-bookmark-button').after(customizedBtn);
        });

        document.querySelectorAll('.works-info .like').forEach((item) => {
          const illustID = item.querySelector('.btn-like').getAttribute('data-illust-id');
          if (illustID == item.getAttribute('data-bp-illust-id')) return;
          item.setAttribute('data-bp-illust-id', illustID);

          if (item.querySelector('.bp-btn-like')) item.querySelector('.bp-btn-like').remove();

          const customizedBtn = item.querySelector('.btn-like').cloneNode(true);

          customizedBtn.classList.remove('btn-like');
          customizedBtn.classList.add('bp-btn-like');
          customizedBtn.style.display = 'block';
          customizedBtn.addEventListener('click', () => {
            if (customizedBtn.classList.contains('done')) {
              if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                deleteBookmarkR18Pages(illustID, 0, customizedBtn);
              } else {
                getToken('delR18', illustID, 1, customizedBtn, null, null);
              }
              return;
            }
            if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
              addBookmarkR18Pages(illustID, 0, customizedBtn, 2);
            } else {
              getToken('addR18', illustID, 1, customizedBtn, 2, null);
            }
          });
          customizedBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            if (!customizedBtn.classList.contains('done')) {
              const modalElms = bkmOptsModalGenerator(true);
              modalElms[0].querySelector('.pb-bkmOptPublic').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmarkR18Pages(illustID, 0, customizedBtn, 0);
                } else {
                  getToken('addR18', illustID, 1, customizedBtn, 0, null);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
              modalElms[0].querySelector('.pb-bkmOptPrivate').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  addBookmarkR18Pages(illustID, 0, customizedBtn, 1);
                } else {
                  getToken('addR18', illustID, 1, customizedBtn, 1, null);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            } else {
              const modalElms = bkmOptsModalGenerator(false);
              modalElms[0].querySelector('.pb-bkmOptDelete').addEventListener('click', () => {
                if (GM_getValue('bkm_token', null) && Date.now() < GM_getValue('bkm_tokenExpireTimestamp', 0)) {
                  deleteBookmarkR18Pages(illustID, 0, customizedBtn);
                } else {
                  getToken('delR18', illustID, 1, customizedBtn, null, null);
                }
                modalElms[0].remove();
                modalElms[1].remove();
                document.body.style.overflow = '';
              });
            }
          });

          item.querySelector('.btn-like').style.display = 'none';
          item.prepend(customizedBtn);
        });
      }
    },
    true,
    () => true,
    null,
    false,
    {
      target: document.body,
      config: { childList: true, subtree: true },
    },
  ],
];
plugins.forEach((plugin) => {
  // プラグインが無効の場合
  if (!pluginSwitch[plugin[0]]) return;
  if (plugin[2]) {
    // MOコールバックの場合
    // MOインスタンス生成
    plugin[4] = new MutationObserver(plugin[1]);
    if (plugin[3]()) {
      // 実行対象ページならMO監視開始
      log(`[bp:${plugin[0]}] MO start observing`);
      plugin[4].observe(plugin[6].target, plugin[6].config);
      plugin[5] = true;
    }
  } else if (plugin[3]()) {
    // 通常関数の場合
    // 実行対象ページなら関数を実行
    plugin[1]();
    plugin[5] = true;
  }
});
log('[bp:pluginManager] ---pluginState---');
log(plugins);

// プラグインMO管理用MO
// MOマネージャーのMOインスタンス生成
let MOManager = new MutationObserver((mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type != 'childList' || location.href == cachedHrefMOManager) return;
    // mutationのタイプがchildListかつキャッシュ済みURLと現在のURLが異なる場合
    cachedHrefMOManager = location.href;
    plugins.forEach((plugin) => {
      if (!pluginSwitch[plugin[0]]) return;
      if (plugin[2]) {
        if (plugin[3]()) {
          if (plugin[5]) return;
          log(`[bp:${plugin[0]}] MO start observing`);
          plugin[4].observe(plugin[6].target, plugin[6].config);
          plugin[5] = true;
        } else if (plugin[5]) {
          log(`[bp:${plugin[0]}] MO disconnected`);
          plugin[4].disconnect();
          plugin[5] = false;
        }
      } else if (plugin[3]() && !plugin[5]) {
        // 関数を実行
        plugin[1]();
        plugin[5] = true;
      }
    });
    log('[bp:pluginManager] ---pluginState---');
    log(plugins);
  }
});
MOManager.observe(document.body, { childList: true, subtree: true });

if (GM_getValue('version', '0.0.0') != GM_info.script.version) {
  const updateModal = document.createElement('div');
  updateModal.classList.add('bp-modal');
  updateModal.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="bp-closeModalBtn bp-closeModalBtn-um"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"></path></svg>
<div class="bp-modalInner">
  <p class="bp-categoryTitle">${i18n.updateModal.title.replace('%0', GM_info.script.version)}</p>
  <p>${i18n.updateModal.body.replace('%0', GM_info.script.version)}</p>
</div><div class="bp-settingBottom">
  <label><input type="checkbox" class="bp-updateModalCheck">${i18n.updateModal.check}</label>
</div>`;
  document.body.appendChild(updateModal);

  const updateModalBack = document.createElement('div');
  updateModalBack.classList.add('bp-modalBack');
  document.body.appendChild(updateModalBack);

  document.body.style.overflow = 'hidden';
  updateModal.querySelector('.bp-closeModalBtn-um').addEventListener('click', () => {
    if (updateModal.querySelector('.bp-updateModalCheck').checked) {
      GM_setValue('version', GM_info.script.version);
    }
    updateModal.remove();
    updateModalBack.remove();
    document.body.style.overflow = '';
  });
  updateModalBack.addEventListener('click', () => {
    if (updateModal.querySelector('.bp-updateModalCheck').checked) {
      GM_setValue('version', GM_info.script.version);
    }
    updateModal.remove();
    updateModalBack.remove();
    document.body.style.overflow = '';
  });
}

if (GM_getValue('firstRun', true)) {
  const firstRunModal = document.createElement('div');
  firstRunModal.classList.add('bp-modal');
  firstRunModal.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="bp-closeModalBtn bp-closeModalBtn-frm"><path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z"></path></svg>
<div class="bp-modalInner">
  <p class="bp-categoryTitle">${i18n.firstRunModal.title}</p>
  <p>${i18n.firstRunModal.body}</p>
</div><div class="bp-settingBottom">
  <label><input type="checkbox" class="bp-firstRunModalCheck">${i18n.firstRunModal.check}</label>
</div>`;
  document.body.appendChild(firstRunModal);

  const firstRunModalBack = document.createElement('div');
  firstRunModalBack.classList.add('bp-modalBack');
  document.body.appendChild(firstRunModalBack);

  document.body.style.overflow = 'hidden';
  firstRunModal.querySelector('.bp-closeModalBtn-frm').addEventListener('click', () => {
    if (firstRunModal.querySelector('.bp-firstRunModalCheck').checked) {
      GM_setValue('firstRun', false);
    }
    firstRunModal.remove();
    firstRunModalBack.remove();
    document.body.style.overflow = '';
  });
  firstRunModalBack.addEventListener('click', () => {
    if (firstRunModal.querySelector('.bp-firstRunModalCheck').checked) {
      GM_setValue('firstRun', false);
    }
    firstRunModal.remove();
    firstRunModalBack.remove();
    document.body.style.overflow = '';
  });
}
