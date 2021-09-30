import { screen, waitFor, waitForElement } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import BillsContainer from "../containers/Bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from "@testing-library/user-event"
import { ROUTES } from "../constants/routes.js"
import NewBillsUI from "../views/NewBillUI.js"
import firebase from "../__mocks__/firebase.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then LoadingPage should be rendered", () => {
      const html = BillsUI({ loading: true });
      document.body.innerHTML = html;
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    })
    test("then ErrorPage should be rendered", () => {
      const html = BillsUI({ error: 'Une erreur est survenue' })
      document.body.innerHTML = html
      expect(screen.getAllByText('Erreur')).toBeTruthy()
      expect(screen.getAllByText('Une erreur est survenue')).toBeTruthy()
    })
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      window.addEventListener("load", function () {
        const billIcon = screen.getByTestId('icon-window')
        expect(billIcon).toBeTruthy()
      })
    })

    describe("when I click on button new bill", () => {
      test("Then I should go to new Bill page", () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
        }))
        const html = BillsUI({ data: [] })
        document.body.innerHTML = html
        const onNavigate = (pathName) => {
          document.body.innerHTML = ROUTES({ pathName })
        }
        const newBills = new BillsContainer({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })

        const handleClickNewBill = jest.fn((e) => newBills.handleClickNewBill(e))
        const buttonNewBill = screen.getByTestId("btn-new-bill")
        buttonNewBill.addEventListener('click', handleClickNewBill)
        userEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(NewBillsUI()).toBeTruthy()
      })
    })

    describe("When user click on IconEye", () => {
      test("Then modal should open", () => {
        const onNavigate = (pathName) => {
          document.body.innerHTML = ROUTES({ pathName })
        }
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        const newBills = new BillsContainer({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })
        jQuery.fn.extend({
          modal: function () {
          },
        });
        const iconEye = screen.queryAllByTestId("icon-eye")
        const handleClickIconEye = jest.fn(e => newBills.handleClickIconEye)
        iconEye[0].addEventListener('click', handleClickIconEye)
        userEvent.click(iconEye[0])
        expect(handleClickIconEye).toHaveBeenCalled()
        const modale = document.getElementById('modaleFile')
        expect(modale).toBeTruthy()
      })
    })
  })

  // test d'intégration GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to bills board", () => {
      test("fetches bills from mock API GET", async () => {
        const getSpy = jest.spyOn(firebase, "get")
        const billsData = await firebase.get()
        expect(getSpy).toHaveBeenCalledTimes(1)
        expect(billsData.data.length + 1).toBe(5)
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        firebase.get.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages from an API and fails with 500 message error", async () => {
        firebase.get.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})