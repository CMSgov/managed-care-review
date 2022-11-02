import { isUser, isCMSUser, isStateUser } from './'

describe('user type assertions', () => {
    it('isUser returns as expected', () => {
        expect(
            isUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'CMS_USER',
            })
        ).toBe(true)
        expect(
            isUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'OTHER_OTHER_USER',
                state_code: 'IL',
            })
        ).toBe(false)
        expect(
            isUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
            })
        ).toBe(false)
    })

    it('isCMSUser returns as expected', () => {
        expect(
            isCMSUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'CMS_USER',
                givenName: 'Margaret',
                familyName: 'Burroughs',
                euaID: 'AAAA',
            })
        ).toBe(true)
        expect(
            isCMSUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'STATE_USER',
                state_code: 'IL',
                givenName: 'Margaret',
                familyName: 'Burroughs',
                euaID: 'AAAA',
            })
        ).toBe(false)
    })

    it('isStateUser returns as expected', () => {
        expect(
            isStateUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'STATE_USER',
                state_code: 'IL',
                givenName: 'Margaret',
                familyName: 'Burroughs',
                euaID: 'AAAA',
            })
        ).toBe(true)
        expect(
            isStateUser({
                name: 'Margaret',
                email: 'burroughs@dusable.org',
                role: 'CMS_USER',
                givenName: 'Margaret',
                familyName: 'Burroughs',
                euaID: 'AAAA',
            })
        ).toBe(false)
    })
})
