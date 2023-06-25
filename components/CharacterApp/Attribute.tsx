import React from "react"
import { Attribute as CharacterAttribute} from "../../characterApp/types"

const Attribute:React.FC<{a:CharacterAttribute}> = ({a}) => {
  return <div>
    {a.abbreviation || a.name}: {a.lvl}
  </div>
}

export default Attribute