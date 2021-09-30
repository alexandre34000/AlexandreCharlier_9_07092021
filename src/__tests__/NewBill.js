
import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from "../constants/routes.js"
import userEvent from "@testing-library/user-event"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase.js"
import firestore from "../app/__mocks__/Firestore.js"


describe("Given I am connected as an employee", () => {
  describe("When I go to NewBill's Page", () => {
    test("Then I choose an other file extension required", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage
      })
      const file = new File(['(⌐□_□)'], 'text.gif', { type: 'image/gif' });
      let value = { target: { value: "text.gif", files: file } }
      const fileInput = screen.getByTestId('file')
      const handleChangeFile = jest.fn(newBill.handleChangeFile(value))
      fileInput.addEventListener('change', handleChangeFile)
      fireEvent.change(fileInput, {
        target: {
          files: file
        }
      })
     
      expect(handleChangeFile).toHaveBeenCalledTimes(1);
      expect(newBill.handleChangeFile(value)).toBeFalsy();
    })

    test("Then I choose a require file", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage
      })

      const file = new File(['(⌐□_□)'], 'text.png', { type: 'image/png' });
      let value = { target: { value: "text.png", files: file } }
      const handleChangeFile = jest.fn(newBill.handleChangeFile(value))
      const inputIdFile = screen.getByTestId('file')

      inputIdFile.addEventListener('change', handleChangeFile)
      fireEvent.change(inputIdFile, { target: { files: file } })

      expect(inputIdFile.files.name).toEqual("text.png")
      expect(handleChangeFile).toHaveBeenCalledTimes(1);
      expect((await firestore.storage.ref().put()).ref.getDownloadURL()).toBe("testURL")
      expect((await firestore.storage.ref().put()).fileName).toEqual("text.png")
    })

    test("Then I submit valid bill", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 't@t.fr'
      }))
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const expenseType = screen.getByTestId('expense-type')
      userEvent.selectOptions(expenseType, [screen.getByText('Transports')])

      const date = screen.getByTestId('datepicker')
      userEvent.type(date, '2021-07-19')

      const amount = screen.getByTestId('amount')
      userEvent.type(amount, '23')

      const pct = screen.getByTestId('pct')
      userEvent.type(pct, '20')

      const justificatif = screen.getByTestId('file')
      const file = new File(['(⌐□_□)'], 'text.png', { type: 'image/png' })
      userEvent.upload(justificatif, file)
      expect(justificatif.files).toHaveLength(1)

      const bill = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => bill.handleSubmit(e))

      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })
  })
})

// test d'intégration POST new bill *********************************

describe("Given I am a user connected as Employee", () => {
  describe("When I fill new bill form", () => {
    test("Fetches bill ID from mock API post", async () => {
      const formBill = {
        id: '47qAXb6fIm2zOKkLzMro',
        email: 't@t.fr',
        type: 'Transports',
        name: '',
        amount: 50,
        date: '2021-07-19',
        vat: '',
        pct: 20,
        commentary: '',
        fileUrl: '',
        fileName: 'test.png'
      }
      const postSpy = jest.spyOn(firebase, 'post')
      const postBill = await firebase.post(formBill)
      //mock de la fonction POST exécuté 1 fois
      expect(postSpy).toHaveBeenCalledTimes(1)
      //mock de la fonction POST retourné avec succés
      expect(postSpy).toReturn()
      //l'ID est présent dans le POST
      expect(postBill).toHaveProperty("data.id")
      expect(postBill.data.id).toBeTruthy()
      expect(postBill.data.id).toMatch("47qAXb6fIm2zOKkLzMro")
      //la bills posté est présente dans la table de bills 
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(bills.data[0].id).toBe(postBill.data.id)
    })
  })
  describe("When new bill is submit", () => {
    test("Then bills table is displayed ", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI()
      const bill = new NewBill({ document, onNavigate, firestore: null, localStorage: window.localStorage })
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => bill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})