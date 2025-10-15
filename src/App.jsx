import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState('저장됨')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [editingLink, setEditingLink] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const editorRef = useRef(null)
  const saveTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const savedRangeRef = useRef(null)

  // LocalStorage에서 초기 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('linkNoteContent')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setContent(data.content || '')
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || ''
        }
      } catch (e) {
        console.error('Failed to load saved content:', e)
      }
    }
  }, [])

  // 자동 저장 (타이핑 멈춘 후 1초)
  const handleInput = () => {
    const newContent = editorRef.current.innerHTML
    setContent(newContent)
    setSaveStatus('저장 중...')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToLocalStorage(newContent)
      setSaveStatus('저장됨')
    }, 1000)
  }

  // LocalStorage에 저장
  const saveToLocalStorage = (content) => {
    const data = {
      content,
      lastSaved: new Date().toISOString(),
      version: 1
    }
    localStorage.setItem('linkNoteContent', JSON.stringify(data))
  }

  // URL 간소화 함수
  const simplifyUrl = (url) => {
    try {
      let simplified = url.replace(/^https?:\/\//, '')
      simplified = simplified.replace(/^www\./, '')
      if (simplified.length > 40) {
        simplified = simplified.substring(0, 37) + '...'
      }
      return simplified
    } catch (e) {
      return url
    }
  }

  // 링크 삽입 버튼 클릭
  const handleInsertLink = () => {
    // 에디터에 포커스를 주고 현재 selection 저장
    editorRef.current.focus()

    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    } else {
      // selection이 없으면 에디터의 끝에 range 생성
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      savedRangeRef.current = range
    }

    setLinkTitle('')
    setLinkUrl('')
    setEditingLink(null)
    setShowLinkModal(true)
  }

  // 링크 삽입/수정 확인
  const handleSaveLinkModal = () => {
    if (!linkUrl.trim()) {
      alert('URL을 입력해주세요.')
      return
    }

    const finalTitle = linkTitle.trim() || simplifyUrl(linkUrl)

    if (editingLink) {
      // 링크 수정
      const linkHtml = `<a href="${linkUrl}" data-link="true">${finalTitle}</a>`
      editingLink.outerHTML = linkHtml
    } else {
      // 새 링크 삽입 - 저장된 range 사용
      if (savedRangeRef.current) {
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)

        const range = savedRangeRef.current
        range.deleteContents()

        const linkElement = document.createElement('a')
        linkElement.href = linkUrl
        linkElement.setAttribute('data-link', 'true')
        linkElement.textContent = finalTitle

        range.insertNode(linkElement)

        // 링크 뒤에 공백 추가
        const space = document.createTextNode(' ')
        range.setStartAfter(linkElement)
        range.insertNode(space)

        // 커서를 공백 뒤로 이동
        range.setStartAfter(space)
        range.setEndAfter(space)
        selection.removeAllRanges()
        selection.addRange(range)

        savedRangeRef.current = null
      }
    }

    handleInput()
    setShowLinkModal(false)
    setContextMenu(null)
  }

  // 에디터 클릭 이벤트
  const handleEditorClick = (e) => {
    // 링크를 클릭한 경우
    if (e.target.tagName === 'A' && e.target.hasAttribute('data-link')) {
      e.preventDefault()

      // Ctrl+클릭이나 우클릭이면 메뉴 표시
      if (e.ctrlKey || e.metaKey) {
        const rect = e.target.getBoundingClientRect()
        setContextMenu({
          x: rect.left,
          y: rect.bottom + 5,
          link: e.target
        })
      } else {
        // 일반 클릭은 바로 새 창으로 이동
        window.open(e.target.href, '_blank')
      }
    } else {
      setContextMenu(null)
    }
  }

  // 에디터 우클릭 이벤트 (컨텍스트 메뉴)
  const handleEditorContextMenu = (e) => {
    if (e.target.tagName === 'A' && e.target.hasAttribute('data-link')) {
      e.preventDefault()
      const rect = e.target.getBoundingClientRect()
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        link: e.target
      })
    }
  }

  // 링크로 이동
  const handleGoToLink = () => {
    if (contextMenu && contextMenu.link) {
      window.open(contextMenu.link.href, '_blank')
      setContextMenu(null)
    }
  }

  // 링크 수정
  const handleEditLink = () => {
    if (contextMenu && contextMenu.link) {
      setEditingLink(contextMenu.link)
      setLinkTitle(contextMenu.link.textContent)
      setLinkUrl(contextMenu.link.href)
      setShowLinkModal(true)
      setContextMenu(null)
    }
  }

  // 링크 삭제
  const handleDeleteLink = () => {
    if (contextMenu && contextMenu.link) {
      const text = document.createTextNode(contextMenu.link.textContent)
      contextMenu.link.replaceWith(text)
      handleInput()
      setContextMenu(null)
    }
  }

  // 백업 (다운로드)
  const handleBackup = () => {
    const data = {
      content: editorRef.current.innerHTML,
      lastSaved: new Date().toISOString(),
      version: 1
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    a.download = `my-links-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 복원 (업로드)
  const handleRestore = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        const shouldReplace = window.confirm(
          '기존 내용을 교체하시겠습니까?\n확인: 교체 / 취소: 추가'
        )

        if (shouldReplace) {
          editorRef.current.innerHTML = data.content || ''
        } else {
          editorRef.current.innerHTML += '\n\n' + (data.content || '')
        }

        handleInput()
        alert('복원이 완료되었습니다.')
      } catch (e) {
        alert('파일을 읽는 중 오류가 발생했습니다.')
        console.error(e)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // 같은 파일 선택 가능하도록
  }

  // 외부 클릭시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('.context-menu')) {
        setContextMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [contextMenu])

  return (
    <div className="app">
      <header className="header">
        <h1>내 링크 노트</h1>
        <div className="toolbar">
          <button onClick={handleInsertLink}>링크 삽입</button>
          <button onClick={handleBackup}>백업</button>
          <button onClick={handleRestore}>복원</button>
          <span className="save-status">{saveStatus}</span>
        </div>
      </header>

      <div className="editor-container">
        <div
          ref={editorRef}
          className="editor"
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          onContextMenu={handleEditorContextMenu}
          suppressContentEditableWarning
        />
      </div>

      {/* 링크 삽입/수정 모달 */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingLink ? '링크 수정' : '링크 삽입'}</h2>
            <div className="modal-field">
              <label>링크 제목</label>
              <input
                type="text"
                placeholder="화면에 표시될 텍스트 (비워두면 URL 자동 표시)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-field">
              <label>이동할 URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveLinkModal()}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowLinkModal(false)}>취소</button>
              <button className="primary" onClick={handleSaveLinkModal}>
                {editingLink ? '수정' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 링크 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <button onClick={handleGoToLink}>URL로 이동</button>
          <button onClick={handleEditLink}>링크 수정</button>
          <button onClick={handleDeleteLink}>링크 삭제</button>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden-input"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default App
