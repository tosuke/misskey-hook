import user from '~/plugins/user'

export default async function ({ redirect }) {
  if (await user() == null) {
    return redirect('/auth')
  }
}