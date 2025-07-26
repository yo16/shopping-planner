'use client'

import { useState, useEffect } from 'react'
import { defaultItems } from '@/lib/items'

export default function Home() {
  const [password, setPassword] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [newItem, setNewItem] = useState('')
  const [addedItems, setAddedItems] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // クッキー関連の関数
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const getCookie = (name: string): string | null => {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      if (c) {
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  }

  // ページロード時にクッキーからパスワードを読み込み
  useEffect(() => {
    const savedPassword = getCookie('shopping_password')
    if (savedPassword) {
      setPassword(savedPassword)
    }
  }, [])

  const handleItemCheck = (item: string, checked: boolean) => {
    const newCheckedItems = new Set(checkedItems)
    if (checked) {
      newCheckedItems.add(item)
    } else {
      newCheckedItems.delete(item)
    }
    setCheckedItems(newCheckedItems)
  }

  const handleAddItem = () => {
    const trimmedItem = newItem.trim()
    if (trimmedItem && !addedItems.includes(trimmedItem) && !defaultItems.includes(trimmedItem)) {
      setAddedItems([...addedItems, trimmedItem])
      const newCheckedItems = new Set(checkedItems)
      newCheckedItems.add(trimmedItem)
      setCheckedItems(newCheckedItems)
      setNewItem('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const selectedItems = Array.from(checkedItems)
      const allItems = [...selectedItems]

      if (allItems.length === 0) {
        setMessage('アイテムを選択するか追加してください')
        return
      }

      const response = await fetch('/api/send-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          items: allItems,
        }),
      })

      if (response.ok) {
        // 送信成功時にパスワードをクッキーに保存（30日間）
        setCookie('shopping_password', password, 30)
        setMessage('送信完了')
        setCheckedItems(new Set())
        setNewItem('')
        setAddedItems([])
        // 成功メッセージを3秒後に自動で消す
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = `エラー: ${errorData.error || 'サーバーエラーが発生しました'}`
        setMessage(errorMessage)
        // エラーメッセージを5秒後に自動で消す
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('送信に失敗しました')
      // エラーメッセージを5秒後に自動で消す
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <h1 className="text-white text-xl font-bold text-center">
            🛒 お買い物プランナー
          </h1>
        </div>

        <div className="p-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
          {/* パスワード入力欄 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🔒</span>
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                パスワード
              </label>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSubmitting && handleSubmit(e)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="パスワードを入力"
              required
            />
          </div>

          {/* アイテムリスト */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-4">
              <span className="text-lg mr-2">📝</span>
              <h2 className="text-sm font-semibold text-gray-700">買い物リスト</h2>
              <div className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {checkedItems.size}個選択
              </div>
            </div>
            <div className="space-y-2 h-40 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200">
              {/* デフォルトアイテム */}
              {defaultItems.map((item) => (
                <label key={item} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item)}
                    onChange={(e) => handleItemCheck(item, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="text-sm text-gray-700 flex-1">{item}</span>
                  {checkedItems.has(item) && <span className="text-blue-500">✓</span>}
                </label>
              ))}
              
              {/* 追加アイテム */}
              {addedItems.map((item) => (
                <label key={item} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-green-50 rounded-lg transition-colors border-l-4 border-green-400">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item)}
                    onChange={(e) => handleItemCheck(item, e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded-md focus:ring-green-500 focus:ring-offset-2"
                  />
                  <span className="text-sm text-gray-700 flex-1 font-medium">{item}</span>
                  {checkedItems.has(item) && <span className="text-green-500">✓</span>}
                </label>
              ))}
            </div>
          </div>

          {/* 新規アイテム追加 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">➕</span>
              <label htmlFor="newItem" className="text-sm font-semibold text-gray-700">
                アイテムを追加
              </label>
            </div>
            <div className="flex space-x-3">
              <input
                type="text"
                id="newItem"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault() // フォーム送信を防ぐ
                    handleAddItem()
                  }
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                placeholder="追加したいアイテムを入力"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                追加
              </button>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="pt-8 mt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-base font-bold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-[0.98] active:scale-95"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  送信中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  買い物リストを送信
                </div>
              )}
            </button>
          </div>

          {/* Toast通知（画面上部固定） */}
          {message && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
              <div className={`px-6 py-4 rounded-xl font-medium shadow-lg border-2 ${
                message === '送信完了' 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
                  : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2 text-lg">
                    {message === '送信完了' ? '✅' : '❌'}
                  </span>
                  <span className="font-semibold">{message}</span>
                </div>
              </div>
            </div>
          )}
          </form>
        </div>
      </div>
    </div>
  )
}